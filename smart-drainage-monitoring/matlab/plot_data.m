function plot_data(readingsTable)
% PLOT_DATA  Generate visualization figures for drainage readings.
%
%   plot_data()                % loads data itself via load_data()
%   plot_data(readingsTable)   % uses an already-loaded table
%
% Produces 4 separate figures:
%   1. Water Level vs Time
%   2. Flow Rate vs Time
%   3. Rain Intensity vs Time
%   4. Water Level and Risk Trend (color-coded by risk level)

    if nargin < 1 || isempty(readingsTable)
        readingsTable = load_data();
    end

    if height(readingsTable) == 0
        error('plot_data:noData', 'No readings available to plot. Run the simulator first.');
    end

    t = readingsTable.created_at;

    % ---- Figure 1: Water Level vs Time ----------------------------------
    figure('Name', 'Water Level vs Time', 'Color', 'w');
    plot(t, readingsTable.water_level, '-o', 'Color', [0.18 0.55 0.60], ...
        'MarkerSize', 3, 'LineWidth', 1.4);
    yline(50, '--', 'WARNING (50%)', 'Color', [0.85 0.62 0.12]);
    yline(75, '--', 'HIGH (75%)', 'Color', [0.85 0.42 0.12]);
    yline(90, '--', 'DANGER (90%)', 'Color', [0.85 0.20 0.12]);
    title('Drainage Water Level Over Time');
    xlabel('Time');
    ylabel('Water Level (%)');
    ylim([0 100]);
    grid on;

    % ---- Figure 2: Flow Rate vs Time -------------------------------------
    figure('Name', 'Flow Rate vs Time', 'Color', 'w');
    plot(t, readingsTable.flow_rate, '-o', 'Color', [0.20 0.55 0.35], ...
        'MarkerSize', 3, 'LineWidth', 1.4);
    title('Water Flow Rate Over Time');
    xlabel('Time');
    ylabel('Flow Rate (L/min)');
    grid on;

    % ---- Figure 3: Rain Intensity vs Time -----------------------------------
    figure('Name', 'Rain Intensity vs Time', 'Color', 'w');
    plot(t, readingsTable.rain_level, '-o', 'Color', [0.75 0.55 0.15], ...
        'MarkerSize', 3, 'LineWidth', 1.4);
    title('Rain Intensity Over Time');
    xlabel('Time');
    ylabel('Rain Intensity (0-100)');
    ylim([0 100]);
    grid on;

    % ---- Figure 4: Water Level and Risk Trend ----------------------------
    figure('Name', 'Water Level and Risk Trend', 'Color', 'w');
    hold on;
    plot(t, readingsTable.water_level, '-', 'Color', [0.5 0.5 0.5], 'LineWidth', 1);

    riskColors = containers.Map( ...
        {'NORMAL', 'WARNING', 'HIGH', 'DANGER'}, ...
        {[0.24 0.71 0.55], [0.85 0.62 0.12], [0.85 0.42 0.12], [0.85 0.20 0.12]});

    riskLevels = {'NORMAL', 'WARNING', 'HIGH', 'DANGER'};
    legendHandles = [];
    legendLabels = {};

    for i = 1:numel(riskLevels)
        level = riskLevels{i};
        mask = readingsTable.risk_level == level;
        if any(mask)
            h = scatter(t(mask), readingsTable.water_level(mask), 28, ...
                riskColors(level), 'filled');
            legendHandles(end + 1) = h; %#ok<AGROW>
            legendLabels{end + 1} = level; %#ok<AGROW>
        end
    end

    title('Water Level Colored by Risk Level');
    xlabel('Time');
    ylabel('Water Level (%)');
    ylim([0 100]);
    if ~isempty(legendHandles)
        legend(legendHandles, legendLabels, 'Location', 'best');
    end
    grid on;
    hold off;

    fprintf('Generated 4 figures.\n');
end
