export const validationData = {
    "comments": "",
    "bibs": {
        "010": {
            // no definition in specifications
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "019": {
            // no definition in specifications
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "020": {
            "name": "ISBN",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "022": {
            "name": "ISSN",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "029": {
            "name": "Document number",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a", "b"],
            "defaultSubfields": ["a", "b"],
            "validStrings": {
                // To do: dropdown or other select using these controlled values
                "a": ["JN","GN","IN","SN","UN"]
                /* 
                [
                    {"code":"JN", "description":"ODS job number"},
                    {"code":"GN", "description":"Government Number"},
                    {"code":"IN", "description":"International Number"},
                    {"code":"SN", "description":"Specialized Agency doc. Number"},
                    {"code":"UN", "description":"UN Map sheets"}
                ]
                */
            }
        },
        "030": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "035": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "037": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "039": {
            "name": "Cataloguing Source (local)",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"],
            "validStrings": {
                // To do: dropdown or other select using these controlled values
                "a": ["DHU","GUN","ITS","SN","VOT"]
                /*
                [
                    {"code":"DHU", "description":"DHL Indexing Unit, UN Material"},
                    {"code":"GUN", "description":"UNOG, Indexing Unit"},
                    {"code":"ITS", "description":"International Number"},
                    {"code":"SN", "description":"DHL, Speech index record"},
                    {"code":"VOT", "description":"DHL, Voting record"}
                ]
                */
            }
        },
        "040": {
            "name": "Cataloguing Source",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a", "b"],
            "defaultSubfields": ["a", "b"],
            "validStrings": {
                // To do: dropdown or other select using these controlled values
                "a": ["SzGeBNU","NNUN"]
                /*
                [
                    {"code":"SzGeBNU", "description":"UNOG Library"},
                    {"code":"NNUN", "description": "DHL"}
                ]
                */
            }
        },
        "041": {
            "name": "Language",
            "required": true,
            "repeatable": false,
            "validIndicators1": ["0"],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["a"],
            "defaultSubfields": [] 
        },
        "048": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "049": {
            "name": "Country of publication",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"]
            /* To do: get a list of ISO Alpha3 codes
            "validStrings": {
                "a": []
            }
            */
        },
        "066": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "069": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "079": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "088": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "089": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["b"],
            "validStrings": {

            }
        },
        "091": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"],
            "validStrings": {
                // To do: dropdown or other select using these controlled values
                "a": ["DER","GEN","GER","LTD","PAR","PRO","RES"]
                /*
                [
                    {"code":"DER" ,"description":"Derestricted"},
                    {"code":"GEN" ,"description":"General"},
                    {"code":"GER" ,"description":"General (not for deposit)"},
                    {"code":"LTD" ,"description":"Limited"},
                    {"code":"PAR" ,"description":"Participants only"},
                    {"code":"PRO" ,"description":"Provisional"},
                    {"code":"RES","description":"Restricted"}
                ]
                */
            }
        },
        "093": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "099": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c"],
            "validStrings": {
                // To do: dropdown or other select using these controlled values
                // $a=UNG and $a=UNH have different lists of possible values for $b
                "a": ["UNG","UNH"],
                "b": ["DHU","DHG","DHL","DHM","DHR","DHS","DHW","DHX","GUN"]
                /*
                "a": [
                    {"code":"UNG", "description":"UN Office at Geneva (UNOG)"},
                    {"code":"UNH", "description":"UN Headquarters"}
                ],
                "b": [
                    {"code":"DHU","description":"UN/SA Reference Collection" },
                    {"code":"DHG","description":"Legal Reference Collection" },
                    {"code":"DHL","description":"Main Collection" },
                    {"code":"DHM","description":"Map Reference Collection"},
                    {"code":"DHR","description":"General Reference Reading Room DHS"},
                    {"code":"DHS","description":"Statistical Reference Collection"},
                    {"code":"DHW","description":"Woodrow Wilson Memorial Collection" },
                    {"code":"DHX","description":"UNX Collection [publications about the UN and specialized agencies]" },
                    // $a=UNG:
                    {"code":"GUN","description":"UN Document Collection" }
                ]
                */
            }
        },
        "100": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "110": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "111": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "130": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "191": {
            "name": "Document symbol / series symbol",
            "required": true,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": ["a", "b"],
            "validSubfields": ["a", "b", "c", "z", "9"],
            "defaultSubfields": ["a", "b", "c"],
            "validStrings": {
                // To do: dropdown or other select using these controlled values
                // $b=A/ $b=E/ $b=S/ all have their own lists of valid strings for $9
                "9": [  "C00","C01","C10","C88","C99","G00","G01","G03","G04","G05","G09","G1A","G10","G11",
                        "G14","G22","G33","G55","G66","G67","G88","G99","X00","X01","X10","X15","X88","X99",
                        "T00","T01","T03","T04","T05","T10","T88","T99"]
            }
        },
        "192": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "198": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "222": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "239": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "240": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "245": {
            "name": "Title",
            "required": true,
            "repeatable": false,
            "validIndicators1": ["1"],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["a", "b", "c", "h", "n", "p"],
            "defaultSubfields": ["a", "b", "c"]
        },
        "246": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a", "b"] 
        },
        "247": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "249": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "250": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b"] 
        },
        "255": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b"] 
        },
        "256": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "260": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c"] 
        },
        "264": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "269": {
            "name": "Publication date",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["a"],
            "defaultSubfields": [],
            "_validRegex": {
                "a": ["^(\\d{4}|\\d{4}-?\\d{2}|\\d{4}-?\\d{2}-?\\d{2})$"] 
            },
            "isDate": {
                "a": true
            }
        },
        "300": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b"] 
        },
        "306": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "310": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "321": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "350": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "354": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "362": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "440": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "490": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "495": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "500": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "501": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "504": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "505": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "506": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "510": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "511": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "515": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "520": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "529": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "530": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "540": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "541": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "545": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "546": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "547": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "550": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "555": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "561": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","u"] 
        },
        "562": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "580": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "586": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "590": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "591": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "592": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "593": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "594": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "595": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "596": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "597": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "598": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "599": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "600": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "610": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "611": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "630": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "650": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "651": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "654": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "658": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "690": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "700": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "710": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "711": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "730": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "740": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "750": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "760": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "767": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["9","o","t","z","x"] 
        },
        "772": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "773": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "780": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "785": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "787": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "791": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "793": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": ["PL","GC","CR","01","02","03","04","05","06"]
            }
        },
        "810": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "830": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "856": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["3","q","u"] 
        },
        "910": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "920": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "930": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "949": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "952": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "955": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "967": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "981": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "989": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "991": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c","d"] 
        },
        "992": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "993": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "995": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "996": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "998": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "999": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c"],
            "validStrings": {
                "a": ["c","d","i","m","o","p","q","r","s","t","u","v","w"]
            }
        }
    },
    "auths": {
        "022": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "029": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "035": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "039": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "040": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","f"] 
        },
        "041": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "046": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["s","t"] 
        },
        "049": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "069": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "072": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "089": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "091": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "099": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "100": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "110": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "111": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "112": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "130": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "150": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "151": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "190": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["b","c"] 
        },
        "191": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c","d"] 
        },
        "245": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "260": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "269": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "300": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "370": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["c","e"] 
        },
        "374": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "375": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "380": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "400": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "410": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "411": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "430": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "450": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "490": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "491": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["d"] 
        },
        "493": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "494": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "495": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "496": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "497": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "500": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "510": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "511": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "520": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "530": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "546": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "550": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "591": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "596": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "610": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "611": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "642": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "643": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "645": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "650": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "667": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "670": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "678": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "680": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["j"] 
        },
        "682": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "688": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "690": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "693": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "694": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "695": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "696": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "697": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "710": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "905": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "915": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "925": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "930": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "933": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "934": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "935": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "936": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "937": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "940": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "950": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "955": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "970": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "975": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "976": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "981": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "989": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "991": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "993": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "994": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "995": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "996": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "997": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "998": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
        "999": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        }
    },
    "speeches": {
        "089": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["b"] 
        },
        "791": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c"] 
        },
        "991": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c","d"] 
        },
        "999": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a"] 
        },
    },
    "votes": {
        "089": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["b"] 
        },
        "245": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c"] 
        },
        "791": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c"] 
        },
        "793": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["v"] 
        },
        "967": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c","d","e"] 
        },
        "968": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c","d","e"] 
        },
        "969": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c","d","e"] 
        },
        "991": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c","d"] 
        },
        "996": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c","d","e","f"] 
        },
        "999": {
            "name": "",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": ["*"],
            "requiredSubfields": [],
            "validSubfields": ["*"],
            "defaultSubfields": ["a","b","c"] 
        },
    }
}
