
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
        "504": {
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
            "defaultSubfields": ["a","g"] 
        },
        "611": {
            "name": "Subject meeting name",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0","2"],
            "validIndicators2": ["_","0","7"],
            "requiredSubfields": [],
            "validSubfields": ["a","g"],
            "defaultSubfields": ["a","g"] 
        },
        "630": {
            "name": "Subject uniform titles",
            "required": false,
            "repeatable": true,
            "validIndicators1": ["_","0"],
            "validIndicators2": ["_","0","7"],
            "requiredSubfields": [],
            "validSubfields": ["a"],
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
        "654": {
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
                "a": ["PL","GC","CR","01","02","03","04","05","06"]
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
