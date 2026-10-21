function readingsTable = load_data(apiUrl)
% LOAD_DATA Fetch drainage readings from the backend REST API.
% The fields include normalized rain intensity, water level, flow rate,
% water-level rise rate, prototype risk score, device/source metadata.
%
% This data is for analysis/experimentation. The prototype risk score is
% not scientifically validated, and rainLevel is not rainfall in mm.

    if nargin < 1 || isempty(apiUrl)
        apiUrl = 'http://localhost:5000/api/readings?limit=1000';
    end

    fprintf('Fetching readings from: %s\n', apiUrl);

    try
        response = webread(apiUrl);
    catch ME
        error('load_data:apiUnreachable', ...
            ['Could not reach the backend API at %s.\n' ...
             'Make sure the Node.js server is running.\nOriginal error: %s'], apiUrl, ME.message);
    end

    if ~isfield(response, 'data') || isempty(response.data)
        warning('load_data:noData', 'API returned no readings. Returning an empty table.');
        readingsTable = table([], [], [], [], [], [], [], [], [], [], ...
            'VariableNames', {'id','device_id','data_source','water_level','rain_level','flow_rate','water_level_rate','risk_score','risk_level','created_at'});
        return;
    end

    entries = response.data;
    n = numel(entries);

    id = nan(n,1);
    device_id = strings(n,1);
    data_source = strings(n,1);
    water_level = nan(n,1);
    rain_level = nan(n,1);
    flow_rate = nan(n,1);
    water_level_rate = nan(n,1);
    risk_score = nan(n,1);
    risk_level = strings(n,1);
    created_at = NaT(n,1);

    for i = 1:n
        e = entries(i);
        id(i) = safeNumeric(e,'id');
        device_id(i) = safeString(e,'device_id',"UNKNOWN");
        data_source(i) = safeString(e,'data_source',"UNKNOWN");
        water_level(i) = safeNumeric(e,'water_level');
        rain_level(i) = safeNumeric(e,'rain_level');
        flow_rate(i) = safeNumeric(e,'flow_rate');
        water_level_rate(i) = safeNumeric(e,'water_level_rate');
        risk_score(i) = safeNumeric(e,'risk_score');
        risk_level(i) = safeString(e,'risk_level',"UNKNOWN");

        if isfield(e,'created_at') && ~isempty(e.created_at)
            try
                created_at(i) = datetime(e.created_at,'InputFormat','yyyy-MM-dd''T''HH:mm:ss.SSSXXX','TimeZone','UTC');
            catch
                try
                    created_at(i) = datetime(e.created_at,'InputFormat','preserveinput');
                catch
                    created_at(i) = NaT;
                end
            end
        end
    end

    readingsTable = table(id,device_id,data_source,water_level,rain_level,flow_rate, ...
        water_level_rate,risk_score,risk_level,created_at);

    validRows = ~isnat(readingsTable.created_at) & ~isnan(readingsTable.water_level);
    readingsTable = sortrows(readingsTable(validRows,:), 'created_at');

    fprintf('Loaded %d valid readings.\n', height(readingsTable));
end

function v = safeNumeric(s, fieldName)
    if isfield(s,fieldName) && ~isempty(s.(fieldName))
        v = double(s.(fieldName));
    else
        v = NaN;
    end
end

function v = safeString(s, fieldName, fallback)
    if isfield(s,fieldName) && ~isempty(s.(fieldName))
        v = string(s.(fieldName));
    else
        v = fallback;
    end
end
