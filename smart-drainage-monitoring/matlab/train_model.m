function model = train_model(readingsTable)
% TRAIN_MODEL  Experiment with a simple overflow classifier trained on
% historical drainage readings, using a Decision Tree if the Statistics
% and Machine Learning Toolbox is available.
%
%   model = train_model()
%   model = train_model(readingsTable)
%
% Features : water_level, rain_level, flow_rate, water_level_rate, risk_score
% Target   : overflow (1 if risk_level is HIGH or DANGER, else 0)
%            i.e. "is the drainage system currently in an elevated/
%            dangerous state" — a reasonable proxy target given we do
%            not yet have real historical overflow-event labels.
%
% This is explicitly an EXPERIMENT, not a production model. If there is
% not enough historical data, or only one class is represented, the
% function says so clearly and does NOT fabricate accuracy numbers.

    fprintf('\n===== Overflow Classification Experiment =====\n');

    if ~license('test', 'Statistics_Toolbox') || ~exist('fitctree', 'file')
        warning(['Statistics and Machine Learning Toolbox not detected (fitctree unavailable). ' ...
                 'Skipping model training. Install the toolbox to run this experiment.']);
        model = [];
        return;
    end

    if nargin < 1 || isempty(readingsTable)
        readingsTable = load_data();
    end

    MIN_ROWS_REQUIRED = 30;

    if height(readingsTable) < MIN_ROWS_REQUIRED
        fprintf(['Not enough historical data to train a meaningful model.\n' ...
                 'Have %d readings, need at least %d.\n' ...
                 'Run the simulator for longer (across multiple scenarios) and try again.\n'], ...
                 height(readingsTable), MIN_ROWS_REQUIRED);
        model = [];
        return;
    end

    % ---- Feature engineering ------------------------------------------
    readingsTable = sortrows(readingsTable, 'created_at');
    data = readingsTable;
    data.water_level_rate(~isfinite(data.water_level_rate)) = 0;

    overflow = double(data.risk_level == "HIGH" | data.risk_level == "DANGER");

    features = [data.water_level, data.rain_level, data.flow_rate, data.water_level_rate, data.risk_score];
    featureNames = {'water_level', 'rain_level', 'flow_rate', 'water_level_rate', 'risk_score'};

    classCounts = [sum(overflow == 0), sum(overflow == 1)];
    fprintf('Class balance -> non-overflow: %d, overflow(HIGH/DANGER): %d\n', classCounts(1), classCounts(2));

    if any(classCounts == 0)
        fprintf(['Only one class is present in the current data (all readings are the same risk ' ...
                 'category). A classifier cannot be meaningfully trained or evaluated until the ' ...
                 'historical data includes both normal and elevated-risk readings.\n' ...
                 'Try running the simulator with the HEAVY_RAIN or OVERFLOW scenario for a while, ' ...
                 'then re-run this script.\n']);
        model = [];
        return;
    end

    % ---- Train/test split (80/20) --------------------------------------
    rng(42); % reproducible split
    cv = cvpartition(overflow, 'HoldOut', 0.2);

    XTrain = features(training(cv), :);
    YTrain = overflow(training(cv));
    XTest  = features(test(cv), :);
    YTest  = overflow(test(cv));

    fprintf('Training rows: %d | Testing rows: %d\n', numel(YTrain), numel(YTest));

    % ---- Train Decision Tree --------------------------------------------
    tree = fitctree(XTrain, YTrain, 'PredictorNames', featureNames);

    % ---- Evaluate ---------------------------------------------------------
    predictions = predict(tree, XTest);
    accuracy = sum(predictions == YTest) / numel(YTest);
    confMat = confusionmat(YTest, predictions);

    fprintf('\n-- Results --\n');
    fprintf('Accuracy: %.2f%% (%d/%d correct on held-out test data)\n', ...
        accuracy * 100, sum(predictions == YTest), numel(YTest));
    fprintf('Confusion Matrix (rows = actual, cols = predicted, order = [0 (no overflow), 1 (overflow)]):\n');
    disp(confMat);

    fprintf('\nSample predictions (first up to 5 test rows):\n');
    nShow = min(5, numel(YTest));
    for i = 1:nShow
        fprintf('  actual=%d  predicted=%d\n', YTest(i), predictions(i));
    end

    fprintf(['\nNote: this is an experimental classifier trained on a proxy target ' ...
             '(HIGH/DANGER risk vs. not) rather than confirmed real-world overflow events. ' ...
             'Treat results as illustrative, not a validated prediction system.\n']);
    fprintf('==================================================\n\n');

    model = struct();
    model.tree = tree;
    model.accuracy = accuracy;
    model.confusionMatrix = confMat;
    model.featureNames = featureNames;
end
