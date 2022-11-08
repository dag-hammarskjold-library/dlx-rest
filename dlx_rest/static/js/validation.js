
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
            "requiredSubfields": [],
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
        "035": {
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            "requiredSubfields": ["a"],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                // To do: dropdown or other select using these controlled values
                "a": ["DHU","GUN","ITS","SN","VOT","DHM","CAP","GEN"]
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
            "requiredSubfields": ["a","b"],
            "validSubfields": ["a", "b"],
            "defaultSubfields": ["a", "b"],
            "validStrings": {
                // To do: dropdown or other select using these controlled values
                "a": ["SzGeBNU","NNUN","LB-BrESC","TH-BaUNE"],
                "b": ["eng"]
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
            "validIndicators1": ["_","0"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"]   // Not specified, but this is the usual behavior
        },
        "049": {
            "name": "Country of publication",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": [
                    "abw", // Aruba
                    "afg", // Afghanistan
                    "ago", // Angola
                    "aia", // Anguilla
                    "ala", // Åland Islands
                    "aLB", // Albania
                    "aND", // Andorra
                    "are", // United Arab Emirates
                    "arg", // Argentina
                    "arm", // Armenia
                    "asm", // American Samoa
                    "ata", // Antarctica
                    "atf", // French Southern Territories
                    "atg", // Antigua and Barbuda
                    "aus", // Australia
                    "aut", // Austria
                    "aze", // Azerbaijan
                    "bdi", // Burundi
                    "bel", // Belgium
                    "ben", // Benin
                    "bes", // Bonaire, Sint Eustatius and Saba
                    "bfa", // Burkina Faso
                    "bgd", // Bangladesh
                    "bgr", // Bulgaria
                    "bhr", // Bahrain
                    "bhs", // Bahamas
                    "bih", // Bosnia and Herzegovina
                    "blm", // Saint Barthélemy
                    "blr", // Belarus
                    "blz", // Belize
                    "bmu", // Bermuda
                    "bol", // Bolivia (Plurinational State of)
                    "bra", // Brazil
                    "brb", // Barbados
                    "brn", // Brunei Darussalam
                    "btn", // Bhutan
                    "bvt", // Bouvet Island
                    "bwa", // Botswana
                    "caf", // Central African Republic
                    "can", // Canada
                    "cck", // Cocos (Keeling) Islands
                    "che", // Switzerland
                    "chl", // Chile
                    "chn", // China
                    "civ", // Côte d'Ivoire
                    "cmr", // Cameroon
                    "cod", // Congo, Democratic Republic of the
                    "cog", // Congo
                    "cok", // Cook Islands
                    "col", // Colombia
                    "com", // Comoros
                    "cpv", // Cabo Verde
                    "cri", // Costa Rica
                    "cub", // Cuba
                    "cuw", // Curaçao
                    "cxr", // Christmas Island
                    "cym", // Cayman Islands
                    "cyp", // Cyprus
                    "cze", // Czechia
                    "deu", // Germany
                    "dji", // Djibouti
                    "dma", // Dominica
                    "dnk", // Denmark
                    "dom", // Dominican Republic
                    "dza", // Algeria
                    "ecu", // Ecuador
                    "egy", // Egypt
                    "eri", // Eritrea
                    "esh", // Western Sahara
                    "esp", // Spain
                    "est", // Estonia
                    "eth", // Ethiopia
                    "fin", // Finland
                    "fji", // Fiji
                    "flk", // Falkland Islands (Malvinas)
                    "fra", // France
                    "fro", // Faroe Islands
                    "fsm", // Micronesia (Federated States of)
                    "gab", // Gabon
                    "gbr", // United Kingdom of Great Britain and Northern Ireland
                    "geo", // Georgia
                    "ggy", // Guernsey
                    "gha", // Ghana
                    "gib", // Gibraltar
                    "gin", // Guinea
                    "glp", // Guadeloupe
                    "gmb", // Gambia
                    "gnb", // Guinea-Bissau
                    "gnq", // Equatorial Guinea
                    "grc", // Greece
                    "grd", // Grenada
                    "grl", // Greenland
                    "gtm", // Guatemala
                    "guf", // French Guiana
                    "gum", // Guam
                    "guy", // Guyana
                    "hkg", // Hong Kong
                    "hmd", // Heard Island and McDonald Islands
                    "hnd", // Honduras
                    "hrv", // Croatia
                    "hti", // Haiti
                    "hun", // Hungary
                    "idn", // Indonesia
                    "imn", // Isle of Man
                    "ind", // India
                    "iot", // British Indian Ocean Territory
                    "irl", // Ireland
                    "irn", // Iran (Islamic Republic of)
                    "irq", // Iraq
                    "isl", // Iceland
                    "isr", // Israel
                    "ita", // Italy
                    "jam", // Jamaica
                    "jey", // Jersey
                    "jor", // Jordan
                    "jpn", // Japan
                    "kaz", // Kazakhstan
                    "ken", // Kenya
                    "kgz", // Kyrgyzstan
                    "khm", // Cambodia
                    "kir", // Kiribati
                    "kna", // Saint Kitts and Nevis
                    "kor", // Korea, Republic of
                    "kwt", // Kuwait
                    "lao", // Lao People's Democratic Republic
                    "lbn", // Lebanon
                    "lbr", // Liberia
                    "lby", // Libya
                    "lca", // Saint Lucia
                    "lie", // Liechtenstein
                    "lka", // Sri Lanka
                    "lso", // Lesotho
                    "ltu", // Lithuania
                    "lux", // Luxembourg
                    "lva", // Latvia
                    "mac", // Macao
                    "maf", // Saint Martin (French part)
                    "mar", // Morocco
                    "mco", // Monaco
                    "mda", // Moldova, Republic of
                    "mdg", // Madagascar
                    "mdv", // Maldives
                    "mex", // Mexico
                    "mhl", // Marshall Islands
                    "mkd", // North Macedonia
                    "mli", // Mali
                    "mlt", // Malta
                    "mmr", // Myanmar
                    "mne", // Montenegro
                    "mng", // Mongolia
                    "mnp", // Northern Mariana Islands
                    "moz", // Mozambique
                    "mrt", // Mauritania
                    "msr", // Montserrat
                    "mtq", // Martinique
                    "mus", // Mauritius
                    "mwi", // Malawi
                    "mys", // Malaysia
                    "myt", // Mayotte
                    "nam", // Namibia
                    "ncl", // New Caledonia
                    "ner", // Niger
                    "nfk", // Norfolk Island
                    "nga", // Nigeria
                    "nic", // Nicaragua
                    "niu", // Niue
                    "nld", // Netherlands
                    "nor", // Norway
                    "npl", // Nepal
                    "nru", // Nauru
                    "nzl", // New Zealand
                    "omn", // Oman
                    "pak", // Pakistan
                    "pan", // Panama
                    "pcn", // Pitcairn
                    "per", // Peru
                    "phl", // Philippines
                    "plw", // Palau
                    "png", // Papua New Guinea
                    "pol", // Poland
                    "pri", // Puerto Rico
                    "prk", // Korea (Democratic People's Republic of)
                    "prt", // Portugal
                    "pry", // Paraguay
                    "pse", // Palestine, State of
                    "pyf", // French Polynesia
                    "qat", // Qatar
                    "reu", // Réunion
                    "rou", // Romania
                    "rus", // Russian Federation
                    "rwa", // Rwanda
                    "sau", // Saudi Arabia
                    "sdn", // Sudan
                    "sen", // Senegal
                    "sgp", // Singapore
                    "sgs", // South Georgia and the South Sandwich Islands
                    "shn", // Saint Helena, Ascension and Tristan da Cunha
                    "sjm", // Svalbard and Jan Mayen
                    "slb", // Solomon Islands
                    "sle", // Sierra Leone
                    "slv", // El Salvador
                    "smr", // San Marino
                    "som", // Somalia
                    "spm", // Saint Pierre and Miquelon
                    "srb", // Serbia
                    "ssd", // South Sudan
                    "stp", // Sao Tome and Principe
                    "sur", // Suriname
                    "svk", // Slovakia
                    "svn", // Slovenia
                    "swe", // Sweden
                    "swz", // Eswatini
                    "sxm", // Sint Maarten (Dutch part)
                    "syc", // Seychelles
                    "syr", // Syrian Arab Republic
                    "tca", // Turks and Caicos Islands
                    "tcd", // Chad
                    "tgo", // Togo
                    "tha", // Thailand
                    "tjk", // Tajikistan
                    "tkl", // Tokelau
                    "tkm", // Turkmenistan
                    "tls", // Timor-Leste
                    "ton", // Tonga
                    "tto", // Trinidad and Tobago
                    "tun", // Tunisia
                    "tur", // Türkiye
                    "tuv", // Tuvalu
                    "twn", // Taiwan, Province of China
                    "tza", // Tanzania, United Republic of
                    "uga", // Uganda
                    "ukr", // Ukraine
                    "umi", // United States Minor Outlying Islands
                    "ury", // Uruguay
                    "usa", // United States of America
                    "uzb", // Uzbekistan
                    "vat", // Holy See
                    "vct", // Saint Vincent and the Grenadines
                    "ven", // Venezuela (Bolivarian Republic of)
                    "vgb", // Virgin Islands (British)
                    "vir", // Virgin Islands (U.S.)
                    "vnm", // Viet Nam
                    "vut", // Vanuatu
                    "wlf", // Wallis and Futuna
                    "wsm", // Samoa
                    "yem", // Yemen
                    "zaf", // South Africa
                    "zmb", // Zambia
                    "zwe", // Zimbabwe
                ]
            }
        },
        "069": {
            // Not defined in bibs validation document
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
            "name": "UN sales number",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "088": {
            // Not defined in bibs validation document
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
            "name": "Content codes",
            "required": true, 
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["b"],
            "validSubfields": ["a","b"],
            "defaultSubfields": ["b"],
            "validStrings": {
                "b": [
                    "A01",
                    //"A02",
                    "A03",
                    //"A04",
                    "A05",
                    "A06",
                    "A07",
                    "A08",
                    "A09",
                    "A10",
                    //"A11",
                    "A12",
                    "A13",
                    "A14",
                    "A15",
                    "A16",
                    "A17",
                    "A18",
                    "A19",
                    "A20",
                    "A21",
                    "B01",
                    "B02",
                    "B03",
                    "B04",
                    "B05",
                    "B06",
                    "B07",
                    "B08",
                    "B09",
                    "B10",
                    "B11",
                    "B12",
                    "B13",
                    "B14",
                    "B15",
                    "B16",
                    "B17",
                    "B18",
                    "B19",
                    "B20",
                    "B21",
                    "B22",
                    "B23",
                    "B24",
                    "B25",
                    "B26",
                    "B27"
                ]
            }
        },
        "091": {
            "name": "Distribution code",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["a"],
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
            // Not defined in bibs validation document
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
            "name": "Location library",
            "required": true,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a","b"],
            "validSubfields": ["a","b","c"],
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            "required": false,  
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a", "b", "c", "d", "e", "f", "q", "r", "z", "9"], 
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            "name": "Unique title",
            "required": false,
            "repeatable": false,
            "validIndicators1": ["0"],
            "validIndicators2": ["0","1","2","3","4","5","6","7","8","9"],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "245": {
            "name": "Title",
            "required": true,
            "repeatable": false,
            "validIndicators1": ["1"],
            "validIndicators2": ["0","1","2","3","4","5","6","7","8","9"],
            "requiredSubfields": ["a"],
            "validSubfields": ["a", "b", "c", "h", "n", "p"],
            "defaultSubfields": ["a", "b", "c"]
        },
        "246": {
            "name": "Varying form of title",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["0","1","2","3"],
            "validIndicators2": ["0","1","2","3","4","5","6","7","8"],
            "requiredSubfields": [],
            "validSubfields": ["a","b","i","n","p"],
            "defaultSubfields": ["a", "b"] 
        },
        "247": {
            // Not defined in bibs validation document
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
            "name": "ITP title",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "250": {
            "name": "Edition statement",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b"],
            "defaultSubfields": ["a","b"] 
        },
        "255": {
            "name": "Cartographic mathematical data",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b"],
            "defaultSubfields": ["a","b"] 
        },
        "256": {
            // Not defined in bibs validation document
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
            "name": "Publication (place, publisher, date)",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c"],
            "defaultSubfields": ["a","b","c"] 
        },
        "269": {
            "name": "Publication date",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "_validRegex": {
                "a": ["^(\\d{4}|\\d{4}-?\\d{2}|\\d{4}-?\\d{2}-?\\d{2})$"] 
            },
            "isDate": {
                "a": true
            }
        },
        "300": {
            "name": "Physical description",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b"],
            "defaultSubfields": ["a","b"] 
        },
        "310": {
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            "name": "Official record designator",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "500": {
            "name": "General note",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "505": {
            "name": "Formatted contents note",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["0","1","2","8"],
            "validIndicators2": ["_","0"],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "515": {
            "name": "Numbering peculiarities note",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "520": {
            "name": "Summary, etc.",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "529": {
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            "name": "Language note",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "547": {
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            "name": "Ownership and custodial history",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","u"],
            "defaultSubfields": ["a","u"] 
        },
        "580": {
            "name": "Linking entry complexity note",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "590": {
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            "name": "Local UNBIS note",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "597": {
            "name": "Local UN Libraries note",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["1","2","3"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "598": {
            // Not defined in bibs validation document
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
            "name": "ITP DOCSYM-2 - Local",
            "required": false,
            "repeatable": false,
            "validIndicators1": ["1"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "600": {
            "name": "Subject personal name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","1","2"],
            "validIndicators2": ["_","7"],
            "requiredSubfields": [],
            "validSubfields": ["a","g"],
            "defaultSubfields": ["a"]
        },
        "610": {
            "name": "Subject corporate name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","2"],
            "validIndicators2": ["_","0","7"],
            "requiredSubfields": [],
            "validSubfields": ["a","g"],
            "defaultSubfields": ["a"] 
        },
        "611": {
            "name": "Subject meeting name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","2"],
            "validIndicators2": ["_","0","7"],
            "requiredSubfields": [],
            "validSubfields": ["a","g"],
            "defaultSubfields": ["a"] 
        },
        "630": {
            "name": "Subject uniform titles",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0"],
            "validIndicators2": ["_","0","7"],
            "requiredSubfields": [],
            "validSubfields": ["a","2"],
            "defaultSubfields": ["a"] 
        },
        "650": {
            "name": "Subject topical",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","1", "2"],
            "validIndicators2": ["_","0","7"],
            "requiredSubfields": [],
            "validSubfields": ["a", "2"],
            "defaultSubfields": ["a"] 
        },
        "651": {
            // Not defined in bibs validation document
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
            "name": "Added entry - personal name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","1"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "710": {
            "name": "Added entry - corporate name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","2"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "711": {
            "name": "Added entry - meeting name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","2"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "730": {
            "name": "Added entry - uniform title",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "740": {
            "name": "Added entry - uncontrolled title",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","1","2","3","4","5","6","7","8","9"],
            "validIndicators2": ["_","2"],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "767": {
            "name": "Translation entry",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["0","1"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["9","o","t","z","x"],
            "defaultSubfields": ["9","o","t","z","x"] 
        },
        "772": {
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            "name": "Committee name",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": ["PL","GC","CR","01","02","03","04","05","06","SP"]
            }
        },
        "830": {
            "name": "Uniform title entry",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["4"],
            "validIndicators2": ["_","0","1","2","3","4","5","6","7","8","9"],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "856": {
            "name": "Electronic location and access",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","1","2","3","4","5","6","7"],
            "validIndicators2": ["_","0","2","8"],
            "requiredSubfields": [],
            "validSubfields": ["3","q","u"],
            "defaultSubfields": ["3","q","u"] 
        },
        "910": {
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            "name": "Product code",
            "required": true,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a"],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "949": {
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
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
            // Not defined in bibs validation document
            // Used for UNDL
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
            "name": "Agenda",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["*"], // carried from authority
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","d","e","f","m","s","z"],
            "defaultSubfields": ["a","b","c","d"] 
        },
        "992": {
            "name": "Action date",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] // $a needs valid date: yyyymmdd
        },
        "993": {
            "name": "Related document symbols",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","1","2","3","4","5","6","7","8","9"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "995": {
            // Not defined in bibs validation document
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
            "name": "Vote note",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "998": {
            // Not defined in bibs validation document
            "name": "Creator/date",
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
            "required": true,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": ["a","b","c"],
            "validSubfields": ["a","b","c"],
            "defaultSubfields": ["a","b","c"],
            "validStrings": {
                "c": ["c","d","i","m","o","p","q","r","s","t","u","v","w"]
            }
        }
    },
    "auths": {
        "022": {
            "name": "ISSN",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "029": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            "name": "Cataloguing source",
            "required": true,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","f"],
            "defaultSubfields": ["a","b","f"],
            "validStrings": {
                // To do: dropdown or other select using these controlled values
                "a": ["SzGeBNU","NNUN","LB-BrESC","TH-BaUNE"],
                "b": ["eng"]
                /*
                [
                    {"code":"SzGeBNU", "description":"UNOG Library"},
                    {"code":"NNUN", "description": "DHL"}
                ]
                */
            }
        },
        "041": {
            // Not defined in the specification document
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
            "name": "Special coded dates",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["s","t"],
            "defaultSubfields": ["s","t"] 
        },
        "049": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            "name": "Heading - personal name",
            "required": false,
            "repeatable": false,
            "validIndicators1": ["0","1","3"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "110": {
            "name": "Heading - corporate name",
            "required": false,
            "repeatable": false,
            "validIndicators1": ["1","2"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "111": {
            "name": "Heading - meeting name",
            "required": false,
            "repeatable": false,
            "validIndicators1": ["2"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "112": {
            // Not defined in the specification document
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
            "name": "Heading - uniform title",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": ["0"],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "150": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            "name": "Main body/session",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["b","c"],
            "defaultSubfields": ["b","c"] 
        },
        "191": {
            "name": "Agenda information",
            "required": false,
            "repeatable": false,
            "validIndicators1": ["0","1","2","3","4"],
            "validIndicators2": ["0"],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","d"],
            "defaultSubfields": ["a","b","c","d"] 
        },
        "245": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            "name": "Associated place",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["c","e"],
            "defaultSubfields": ["c","e"] 
        },
        "374": {
            // Not defined in the specification document
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
            "name": "Gender",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            //"validStrings": {"a": []}
        },
        "380": {
            // Not defined in the specification document
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
            "name": "See from tracing - personal name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["0","1","3"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","5"],
            "defaultSubfields": ["a"] 
        },
        "410": {
            "name": "See from tracing - corporate name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["1","2"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","5"],
            "defaultSubfields": ["a"] 
        },
        "411": {
            "name": "See from tracing - meeting name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["2"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","5"],
            "defaultSubfields": ["a"] 
        },
        "430": {
            "name": "See from tracing - uniform title",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": ["0"],
            "requiredSubfields": [],
            "validSubfields": ["a","5"],
            "defaultSubfields": ["a"] 
        },
        "450": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            "name": "See reference for ITP publication",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["0"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["d"],
            "defaultSubfields": ["d"] 
        },
        "493": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            "name": "See also from tracing - corporate name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["1","2"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","w"],
            "defaultSubfields": ["a"] 
        },
        "511": {
            "name": "See also from tracing - meeting name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["2"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","w"],
            "defaultSubfields": ["a"] 
        },
        "520": {
            // Not defined in the specification document
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
            "name": "See also from tracing - uniform title",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": ["0"],
            "requiredSubfields": [],
            "validSubfields": ["a","w"],
            "defaultSubfields": ["a"] 
        },
        "546": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            "name": "Non-public general note",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "670": {
            "name": "Source data found",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","u"],
            "defaultSubfields": ["a"] 
        },
        "678": {
            "name": "Bibliographical or historical data",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","u"],
            "defaultSubfields": ["a"] 
        },
        "680": {
            "name": "Public general note",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["i"],
            "defaultSubfields": ["i"] 
        },
        "682": {
            "name": "Deleted heading information",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","i"],
            "defaultSubfields": ["a"] 
        },
        "688": {
            "name": "Application history note",
            "required": false,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "690": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            "name": "Source code",
            "required": false,
            "repeatable": false,
            "validIndicators1": ["0"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": { "a": ["DHL","GEN"]}
        },
        "915": {
            "name": "Record type",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": { "a": [
                "CN",   // name of corporate body
                "MN",   // name of conference
                "PN",   // name of person
                "SR",   // series title
                "TI",   // uniform title
                "UC",   // name of UN corporate body
                "UM",   // name of UN conference
                "US",   // UN series title
                "UT"    // UN uniform title
            ]}
        },
        "925": {
            "name": "Authorized entry for series symbol",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"]
        },
        "930": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            "name": "Series start/series end date",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] // Is a date, needs regex pattern
        },
        "975": {
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document
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
            // Not defined in the specification document, but there are values necessary for, e.g., record review/approval
            // such as 999$c=t
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
        "039": {
            "name": "Cataloguing Source - Local",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": ["ITS"]
            }
        },
        "040": {
            "name": "Cataloguing Source",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": ["NNUN"]
            }
        },
        "089": {
            "name": "Content code",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b"],
            "defaultSubfields": ["a","b"],
            "validStrings": {
                "a": ["Speech index record"],   // Is string validation case sensitive? Should it be?
                "b": ["B22"]
            }
        },
        "269": {
            "name": "Date of meeting",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "isDate": {
                "a": true
            }
            // Is date
            // Verify value is the same as in 992$a
            // Can 992$a or 269$a be auto-assigned via save-action if one is provided?
        },
        "700": {
            "name": "Added entry - personal name",
            "required": true,
            "repeatable": false,
            "validIndicators1": ["0","1","3"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "710": {
            "name": "Added entry - corporate name",
            "required": true,
            "repeatable": false,
            "validIndicators1": ["0","1","2"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "791": {
            "name": "UN resolution/meeting record symbol",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","q","r"],
            "defaultSubfields": ["a","b","c"] 
        },
        "930": {
            "name": "Product code",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": ["ITS"]
            }
        },
        "991": {
            "name": "Agenda information",
            "required": true,
            "repeatable": true,
            "validIndicators1": ["1","2","3","4"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","d"],
            "defaultSubfields": ["a","b","c","d"] 
        },
        "992": {
            "name": "Date of meeting",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "isDate": {
                "a": true
            }
            // Is date; see also 269$a 
        },
        "999": {
            "name": "Creator/date",
            "required": true,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c"],
            "defaultSubfields": ["a","b","c"] 
        },
    },
    "votes": {
        "039": {
            "name": "Cataloguing source - Local",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": ["VOT"]
            }
        },
        "040": {
            "name": "Cataloguing source",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": ["NNUN"]
            }
        },
        "089": {
            "name": "Content code",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["b"],
            "defaultSubfields": ["b"],
            "validStrings": {
                "b": ["B23"]
            }
        },
        "245": {
            "name": "Title statement",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": ["0","1","2","3","4","5","6","7","8","9"],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c"],
            "defaultSubfields": ["a","b","c"] 
            // Can values be automatically copied from the bib record linked in 791?
        },
        "269": {
            "name": "Date of meeting",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "isDate": {
                "a": true
            }
            // Is date. Same as 992$a. Can we get the date from 992$a on the record linked in 791?
        },
        "591": {
            "name": "Vote note",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": [
                    "ADOPTED WITHOUT VOTE",
                    "RECORDED",
                    "RECORDED - No machine generated vote",
                    "NON-RECORDED"
                ]
            }
        },
        "791": {
            "name": "UN resolution/meeting record symbol",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","z"],
            "defaultSubfields": ["a","b","c"]   // Values copied over from 191 of the linked record?
        },
        "793": {
            "name": "Committee name",
            "required": false,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","v"],
            "defaultSubfields": ["v"] 
            // Spec indicates "only possible value" of PLENARY MEETING; should that be a string validation?
        },
        "930": {
            "name": "Product code",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "validStrings": {
                "a": ["VOT"]
            }
        },
        "952": {
            "name": "Meeting document symbol",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
        },
        "967": {
            "name": "Voting information",   // divided into three fields (967, 968, 969) because Horizon has a limit on repeated tags
            "required": true,               // Only one of these should be required, though, not all three
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","d","e"],
            "defaultSubfields": ["a","b","c","d","e"]
        },
        "968": {
            "name": "Voting information",   // divided into three fields (967, 968, 969) because Horizon has a limit on repeated tags
            "required": true,               // Only one of these should be required, though, not all three
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","d","e"],
            "defaultSubfields": ["a","b","c","d","e"]
        },
        "969": {
            "name": "Voting information",   // divided into three fields (967, 968, 969) because Horizon has a limit on repeated tags
            "required": true,               // Only one of these should be required, though, not all three
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","d","e"],
            "defaultSubfields": ["a","b","c","d","e"]
        },
        "991": {
            "name": "Agenda",
            "required": true,
            "repeatable": true,
            "validIndicators1": ["*"],  // Carried over from authority...
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","d"], 
            "defaultSubfields": ["a","b","c","d"]   // Values carried over from authority...
        },
        "992": {
            "name": "Action date",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"],
            "isDate": {
                "a": true
            }
            // Is date.  Copy from bib record corresponding to resolution?
        },
        "993": {
            "name": "Related document symbols",
            "required": true,
            "repeatable": true,
            "validIndicators1": ["*"],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a"],
            "defaultSubfields": ["a"] 
            // Copy from bib record corresponding to resolution?
        },
        "996": {
            "name": "Vote note",
            "required": true,
            "repeatable": false,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c","d","e","f"],
            "defaultSubfields": ["a","b","c","d","e","f"]
            // Regex: only numbers in any subfields
        },
        "999": {
            "name": "Creator/date",
            "required": true,
            "repeatable": true,
            "validIndicators1": [],
            "validIndicators2": [],
            "requiredSubfields": [],
            "validSubfields": ["a","b","c"],
            "defaultSubfields": ["a","b","c"],
            "validStrings": {
                "c": ["s","t"]
            }
        },
    }
}
