host.factory('grader', function () {
    'use strict';

    var conversions = {};
    conversions.vb          = 0;
    conversions['v0-']      = 1;
    conversions.v0          = 2;
    conversions['v0+']      = 3;
    conversions.v1          = 10;
    conversions.v2          = 20;
    conversions.v3          = 30;
    conversions.v4          = 40;
    conversions.v5          = 50;
    conversions.v6          = 60;
    conversions.v7          = 70;
    conversions.v8          = 80;
    conversions.v9          = 90;
    conversions.v10         = 100;
    conversions.v11         = 110;
    conversions.v12         = 120;
    conversions.v13         = 130;
    conversions.v14         = 140;
    conversions.v15         = 150;
    conversions.v16         = 160;
    conversions.v17         = 170;
    conversions.v18         = 180;
    conversions.v19         = 190;
    conversions.v20         = 200;

    conversions['3rd Class'] = 3000;
    conversions['4th Class'] = 4000;
    conversions['5.0']      = 5000;
    conversions['5.1']      = 5010;
    conversions['5.2']      = 5020;
    conversions['5.3']      = 5030;
    conversions['5.4']      = 5040;
    conversions['5.5']      = 5050;
    conversions['5.6']      = 5060;
    conversions['5.7']      = 5070;
    conversions['5.8']      = 5080;
    conversions['5.8+']     = 5081;
    conversions['5.9-']     = 5090;
    conversions['5.9']      = 5091;
    conversions['5.9+']     = 5092;
    conversions['5.10a']    = 5100;
    conversions['5.10b']    = 5101;
    conversions['5.10c']    = 5102;
    conversions['5.10d']    = 5103;
    conversions['5.11a']    = 5110;
    conversions['5.11b']    = 5111;
    conversions['5.11c']    = 5112;
    conversions['5.11d']    = 5113;
    conversions['5.12a']    = 5120;
    conversions['5.12b']    = 5121;
    conversions['5.12c']    = 5122;
    conversions['5.12d']    = 5123;
    conversions['5.13a']    = 5130;
    conversions['5.13b']    = 5131;
    conversions['5.13c']    = 5132;
    conversions['5.13d']    = 5133;
    conversions['5.14a']    = 5140;
    conversions['5.14b']    = 5141;
    conversions['5.14c']    = 5142;
    conversions['5.14d']    = 5143;
    conversions['5.15a']    = 5150;
    conversions['5.15b']    = 5151;
    conversions['5.15c']    = 5152;
    conversions['5.15d']    = 5153;
    conversions['5.16a']    = 5160;
    conversions['5.16b']    = 5161;
    conversions['5.16c']    = 5162;
    conversions['5.16d']    = 5163;
    conversions['5.17a']    = 5170;
    conversions['5.17b']    = 5171;
    conversions['5.17c']    = 5172;
    conversions['5.17d']    = 5173;


    function convert(grade, min) {
        if (grade) {
            if (conversions.hasOwnProperty(grade)) {
                return conversions[grade];
            }
            if (/^5\.1\d$/.test(grade)) {
                if (min) {
                    return convert(grade + 'a');
                }
                else {
                    return convert(grade + 'd');
                }
            }
        }

        return undefined;
    }

    return function(min, max) {
        if ((!min || min[0] === 'v') && (!max || max[0] === 'v')) {
            min = min ? convert(min, true) : conversions.vb;
            max = max ? convert(max, false) : conversions.v20;
        }
        else if ((!min || min[0] === '5') && (!max || max[0] === '5')) {
            min = min ? convert(min, true) : conversions['3rd Class'];
            max = max ? convert(max, false) : conversions['5.16d'];
        }
        else {
            min = max = undefined;
        }

        if (min && max) {
            return function(grade) {
                return grade >= min && grade <= max;
            };
        }
        return function() {
            return false;
        };
    };
});