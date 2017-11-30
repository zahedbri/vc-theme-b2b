﻿var storefrontApp = angular.module('storefrontApp');

storefrontApp.service('searchQueryService', [function () {
    return {
        // Deserializes search query strings like 'key=value1[,value2]' or 'key=key1:value1[,value2[;key2:value3[,value4]]]'
        deserialize: function (searchQuery, defaults) {
            var deserializeValues = function(string) {
                return string.split(',');
            };
            var deserializePairs = function (string) {
                return _.object(string.split(';').map(function(pairString) {
                    return _.reduce(pairString.split(':'), function (key, value) {
                        return [key, deserializeValues(value)];
                    });
                }));
            };
            searchQuery = searchQuery || {};
            defaults = defaults || {};
            var result = {};
            _.each(Object.keys(searchQuery), (function (key) {
                var string = searchQuery[key];
                if (string) {
                    var deserialize = string.includes(':') ? deserializePairs : deserializeValues;
                    result[key] = deserialize(string);
                }
            }));
            result = _.defaults(result, defaults);
            return result;
        },

        merge: function (searchQuery, changes, switchable) {
            if (!switchable) {
                return _.extend(searchQuery, changes);
            } else {
                var mergeValues = function (searchQueryValues, changeValues) {
                    var checkedValues = _.difference((searchQueryValues || []).concat(changeValues || []), _.intersection(searchQueryValues, changeValues));
                    return changeValues !== null && checkedValues.length ? checkedValues : null;
                };
                var mergePairs = function (searchQueryPairs, changePairs) {
                    return _.object(_.compact(_.union(Object.keys(searchQueryPairs), Object.keys(changePairs)).map(function (key) {
                        var mergedValues = mergeValues(searchQueryPairs[key], changePairs[key]);
                        return mergedValues !== null ? [key, mergedValues] : null;
                    })));
                };
                return _.object(_.compact(_.union(Object.keys(searchQuery), Object.keys(changes)).map(function (key) {
                    var searchQueryValues = searchQuery[key];
                    var changeValues = changes[key];
                    if (changeValues !== null) {
                        if (searchQueryValues && changeValues && angular.isArray(searchQueryValues) !== angular.isArray(changeValues)) {
                            throw 'Type of ' + key + ' in search query is' + typeof (searchQueryValues[key]) + ' while in changes is' + typeof (changeValues[key]);
                        }
                        if (!angular.isArray(changeValues)) {
                            return [key, mergePairs(searchQueryValues || [], changeValues || [])];
                        } else {
                            var mergedValues = mergeValues(searchQueryValues, changeValues);
                            return mergedValues !== null ? [key, mergedValues] : null;
                        }
                    } else {
                        return null;
                    }
                })));
            }
        },

        // Serializes search query objects like { view: ['list'], terms: { Color: ["Black, "Red"], Brand: ["VirtoCommerce", "Microsoft"] } }  to string 
        serialize: function (searchQuery, defaults) {
            var serializeValues = function (values) {
                return values.join(',');
            };
            var serializePairs = function (pairs) {
                return _.map(Object.keys(pairs), function(key) {
                    return [key, serializeValues(pairs[key])].join(':');
                }).join(';');
            };
            searchQuery = searchQuery || {};
            defaults = defaults || {};
            var result = _.defaults(searchQuery, defaults);
            return _.mapObject(result, function(values, key) {
                return values !== null ? !angular.isArray(values) ? serializePairs(values) : serializeValues(values) : null;
            });
        }
    }
}]);
