function stats = analyze_data(readingsTable)
% ANALYZE_DATA  Compute summary statistics over drainage readings.
%
%   stats = analyze_data()               % loads data itself via load_data()
%   stats = analyze_data(readingsTable)   % uses an already-loaded table
%
% Returns a struct `stats` with the computed values and also prints a
% readable summary to the console.

    if nargin < 1 || isempty(readingsTable)
        readingsTable = load_data();
    end

    if height(readingsTable) == 0
        error('analyze_data:noData', 'No readings available to analyze. Run the simulator first.');
    end

    stats = struct();
    stats.count = height(readingsTable);

    stats.meanWaterLevel = mean(readingsTable.water_level, 'omitnan');
    stats.maxWaterLevel  = max(readingsTable.water_level);
    stats.minWaterLevel  = min(readingsTable.water_level);

    stats.meanFlowRate = mean(readingsTable.flow_rate, 'omitnan');
    stats.maxFlowRate  = max(readingsTable.flow_rate);

    stats.meanRainLevel = mean(readingsTable.rain_level, 'omitnan');
    stats.maxRainLevel  = max(readingsTable.rain_level);
    stats.minRainLevel  = min(readingsTable.rain_level);

    stats.warningCount = sum(readingsTable.risk_level == "WARNING");
    stats.highCount     = sum(readingsTable.risk_level == "HIGH");
    stats.dangerCount   = sum(readingsTable.risk_level == "DANGER");
    stats.normalCount   = sum(readingsTable.risk_level == "NORMAL");

    stats.timeRangeStart = min(readingsTable.created_at);
    stats.timeRangeEnd   = max(readingsTable.created_at);

    % ---- Print summary --------------------------------------------------
    fprintf('\n===== Drainage Data Analysis =====\n');
    fprintf('Readings analyzed : %d\n', stats.count);
    fprintf('Time range        : %s  to  %s\n', ...
        datestr(stats.timeRangeStart), datestr(stats.timeRangeEnd));
    fprintf('\n-- Water Level (%%) --\n');
    fprintf('  Mean : %.2f\n', stats.meanWaterLevel);
    fprintf('  Max  : %.2f\n', stats.maxWaterLevel);
    fprintf('  Min  : %.2f\n', stats.minWaterLevel);
    fprintf('\n-- Flow Rate (L/min) --\n');
    fprintf('  Mean : %.2f\n', stats.meanFlowRate);
    fprintf('  Max  : %.2f\n', stats.maxFlowRate);
    fprintf('\n-- Rainfall (0-100) --\n');
    fprintf('  Mean : %.2f\n', stats.meanRainLevel);
    fprintf('  Max  : %.2f\n', stats.maxRainLevel);
    fprintf('  Min  : %.2f\n', stats.minRainLevel);
    fprintf('\n-- Risk Events --\n');
    fprintf('  NORMAL  : %d\n', stats.normalCount);
    fprintf('  WARNING : %d\n', stats.warningCount);
    fprintf('  HIGH    : %d\n', stats.highCount);
    fprintf('  DANGER  : %d\n', stats.dangerCount);
    fprintf('===================================\n\n');
end
