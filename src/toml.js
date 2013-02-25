var toml = (function () {

    var parseGroup = function (result, str) {
        var group = parseGroupName(str);
        if (group.indexOf('.') !== -1) {
            var groups = parseSubGroups(group);
            addGroups(result, groups);
        } else {
            addGroup(result, group);
        }

        function parseGroupName(str) {
            var start = str.indexOf('['), end = str.indexOf(']');
            return str.substring(start + 1, end);
        }

        function parseSubGroups(str) {
            return str.split('.');
        }

        function addGroup(result, group) {
            result[group] = {};
        }

        function addGroups(result, groups) {
            groups.reduce(function (prev, current) {
                if (!result[prev]) {
                    addGroup(result, prev);
                }
                addGroup(result[prev], current);
                return current;
            });
        }
    }

    var parseExpression = function (result, line) {
        var pair = parseNameValue(line);
        var value = parseValue(pair.value);

        result[pair.name] = value;

        function parseNameValue(line) {
            var equal = line.indexOf('=');
            return {
                name: line.substring(0, equal),
                value: line.substring(equal + 1)
            };
        }

        function parseValue(value) {
            if (array(value)) {
                return parseArray(value);
            }

            return parsePrimitive(value);

            function array(value) {
                return value.charAt(0) === '[' && value.charAt(value.length - 1) === ']';
            }
        }

        function parseArray(value) {
            var values = parseArrayValues(value);
            return values.map(function(v) {
                return parseValue(v);
            });

            function parseArrayValues(value) {
                var parsed = [];
                var array = value.substring(1, value.length - 1);
                var commasMap = commasMap(array);
                commasMap.reduce(function(prev, next) {
                    parsed.push(array.substring(prev + 1, next));
                    return next;
                }, -1);

                return parsed;

                function commasMap(value) {
                    var commasMap = [];
                    var inArray = false, depth = 0;
                    for(var index = 0; index < value.length; index++) {
                        var element = value[index];
                        if (element === '[') {
                            depth++;
                        } else if (element === ']') {
                            depth--;
                        }

                        if (element === ',' && depth === 0) {
                            commasMap.push(index);
                        }
                    }

                    commasMap.push(value.length);

                    return commasMap;
                }
            }
        }

        function parsePrimitive(value) {
            if (date(value)) {
                return new Date(value);
            }

            return eval(value);

            function date(value) {
                return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/.test(value);
            }
        }
    }

    var parseLine = function (result, line) {
        if (group(line)) {
            parseGroup(result, line);
        } else if (expression(line)) {
            parseExpression(result, line);
        }

        function group(line) {
            return line.charAt(0) === '[';
        }

        function expression(line) {
            return line.indexOf('=') > 0;
        }
    }

    var parse = function (str) {
        var result = {};
        var lines = str.split('\n');

        lines.forEach(function (line) {
            parseLine(result, line);
        });

        return result;
    }

    return {
        parse: parse
    };

})();