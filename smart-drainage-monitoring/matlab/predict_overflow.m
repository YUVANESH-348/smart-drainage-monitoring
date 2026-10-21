function result = predict_overflow(readingsTable, windowSize)
% PREDICT_OVERFLOW  Estimate time-to-overflow from recent water-level
% readings using a simple linear rate-of-change model.
%
%   result = predict_overflow()
%   result = predict_overflow(readingsTable)
%   result = predict_overflow(readingsTable, windowSize)
%
% windowSize (default 10) controls how many of the most recent readings
% are used to estimate the current rate of rise, via a linear fit
% (polyfit) rather than just the first/last two points, which makes the
% estimate less sensitive to a single noisy reading.
%
% IMPORTANT: This is an EXPERIMENTAL, linear estimate only. It is not
% scientifically or medically validated, and should not be used as the
% sole basis for real-world safety decisions. It assumes the current
% rate of rise continues unchanged, which is rarely exactly true for
% real rainfall/drainage systems.

    if nargin < 1 || isempty(readingsTable)
        readingsTable = load_data();
    end
    if nargin < 2 || isempty(windowSize)
        windowSize = 10;
    end

    if height(readingsTable) == 0
        error('predict_overflow:noData', 'No readings available. Run the simulator first.');
    end

    n = height(readingsTable);
    windowSize = min(windowSize, n);
    recent = readingsTable(end - windowSize + 1:end, :);

    currentLevel = recent.water_level(end);

    result = struct();
    result.currentLevel = currentLevel;
    result.windowSize = windowSize;
    result.disclaimer = ['Experimental linear estimate only. Not scientifically or ' ...
        'medically validated. Assumes the current rate of rise continues unchanged.'];

    if windowSize < 2
        result.trend = "STABLE";
        result.ratePerMinute = 0;
        result.overflowPredicted = false;
        result.estimatedMinutes = NaN;
        printResult(result);
        return;
    end

    % Convert timestamps to elapsed minutes for the fit.
    tMinutes = minutes(recent.created_at - recent.created_at(1));
    levels = recent.water_level;

    % Linear fit: level = p(1)*t + p(2)
    p = polyfit(tMinutes, levels, 1);
    ratePerMinute = p(1);

    levelDelta = levels(end) - levels(1);
    STABLE_BAND = 1.5; % percentage points across the window

    if levelDelta > STABLE_BAND
        trend = "RISING";
    elseif levelDelta < -STABLE_BAND
        trend = "FALLING";
    else
        trend = "STABLE";
    end

    result.trend = trend;
    result.ratePerMinute = ratePerMinute;

    if strcmp(trend, "RISING") && ratePerMinute > 0
        remainingCapacity = 100 - currentLevel;
        estimatedMinutes = remainingCapacity / ratePerMinute;
        result.estimatedMinutes = estimatedMinutes;
        % Only call it a real overflow risk within a 60-minute horizon.
        result.overflowPredicted = estimatedMinutes <= 60;
    else
        result.estimatedMinutes = NaN;
        result.overflowPredicted = false;
    end

    printResult(result);
end

function printResult(result)
    fprintf('\n===== Overflow Prediction (Experimental) =====\n');
    fprintf('Current Level : %.2f%%\n', result.currentLevel);
    fprintf('Trend         : %s\n', result.trend);
    fprintf('Rate          : %.2f %%/min\n', result.ratePerMinute);

    if result.overflowPredicted
        fprintf('Estimated Overflow Time : %.1f minutes\n', result.estimatedMinutes);
        fprintf('Prediction    : OVERFLOW POSSIBLE\n');
    elseif strcmp(result.trend, "RISING")
        fprintf('Prediction    : Rising, but not projected to overflow within 60 minutes\n');
    elseif strcmp(result.trend, "FALLING")
        fprintf('Prediction    : Water level falling. No overflow risk from current trend.\n');
    else
        fprintf('Prediction    : Water level stable. No overflow risk from current trend.\n');
    end

    fprintf('Note: %s\n', result.disclaimer);
    fprintf('================================================\n\n');
end
