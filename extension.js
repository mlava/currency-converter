const config = {
    tabTitle: "Currency Converter",
    settings: [
        {
            id: "currConv-apiKey",
            name: "API Key",
            description: "Your free API key from https://app.currencyapi.com/api-keys",
            action: { type: "input", placeholder: "Add API key here" },
        },
        {
            id: "currConv-base",
            name: "Your Base Currency",
            description: "Must be a standard three letter currency code, all in CAPS",
            action: { type: "input", placeholder: "AUD" },
        },
        {
            id: "currConv-replacePreference",
            name: "Add converted currency inline or at the end of the block",
            description: "Either inline or end",
            action: { type: "input", placeholder: "inline" },
        },
    ]
};

export default {
    onload: ({ extensionAPI }) => {
        extensionAPI.settings.panel.create(config);

        extensionAPI.ui.commandPalette.addCommand({
            label: "Convert Currency",
            callback: () => convertCurrency(false)
        });
        
        window.roamAlphaAPI.ui.blockContextMenu.addCommand({
            label: "Convert Currency",
            callback: (e) => convertCurrency(e),
        });

        async function convertCurrency(e) {
            var key, baseCurrency, replacePreference;
            breakme: {
                if (!extensionAPI.settings.get("currConv-apiKey")) {
                    key = "API";
                    sendConfigAlert(key);
                    break breakme;
                } else if (!extensionAPI.settings.get("currConv-base")) {
                    key = "curr";
                    sendConfigAlert(key);
                    break breakme;
                }
                else {
                    const apiKey = extensionAPI.settings.get("currConv-apiKey");

                    const regex = /^[A-Z]{3}$/m;
                    if (extensionAPI.settings.get("currConv-base").match(regex)) {
                        baseCurrency = extensionAPI.settings.get("currConv-base");
                    } else {
                        key = "curr2";
                        sendConfigAlert(key);
                        break breakme;
                    }

                    if (!extensionAPI.settings.get("currConv-replacePreference")) {
                        replacePreference = "inline";
                    } else {
                        const regex = /^inline|end$/;
                        if (extensionAPI.settings.get("currConv-replacePreference").match(regex)) {
                            replacePreference = extensionAPI.settings.get("currConv-replacePreference");
                        } else {
                            key = "rePref";
                            sendConfigAlert(key);
                            break breakme;
                        }
                    }

                    var uid, text;
                    if (e) { // bullet right-click
                        uid = e["block-uid"].toString();
                        text = e["block-string"].toString();
                    } else { // command palette
                        uid = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                        var block = await window.roamAlphaAPI.data.pull("[:block/string]", [":block/uid", uid]);
                        text = block[":block/string"].toString();
                    }
                    if (text.length > 1) {
                        const regex = /(([0-9.]+) ([A-Z]{3}))/gm;
                        let m;
                        var newString = text;

                        //test for regex matches
                        if (!text.match(regex)) { // no matches
                            noCurrency();
                        } else {
                            const matches = text.matchAll(regex);

                            // call to currencyapi.com API
                            var requestOptions = {
                                method: 'GET',
                                timeout: 0,
                                redirect: 'follow',
                            };
                            var url = "https://api.currencyapi.com/v3/latest?apikey=" + apiKey + "&base_currency=" + baseCurrency;
                            fetch(url, requestOptions).then(function (response) {
                                return response.json();
                            }).then(function (data) {
                                for (const m of matches) { //regex found at least one currency to convert
                                    let origValue = m[2];
                                    let currency = m[3];
                                    console.log(`Converting ${origValue} in ${currency} to ${baseCurrency}`);

                                    for (const [key, value] of Object.entries(data.data)) {
                                        if (key == currency) {
                                            let convRate = value.value;
                                            let newValue = (origValue * (1 / convRate)).toFixed(2);
                                            if (replacePreference == "inline") {
                                                newString = newString.replace(m[1], "" + m[1] + " (" + newValue + " " + baseCurrency + ")");
                                            } else if (replacePreference == "end") {
                                                newString = newString + ' (' + newValue + ' ' + baseCurrency + ')';
                                            }
                                            window.roamAlphaAPI.updateBlock(
                                                { block: { uid: uid, string: newString.toString(), open: true } });
                                        }
                                    }
                                }
                            });
                        }
                    }
                    else { // no text in block to match
                        noCurrency();
                    }
                    
                }
            }
        };
    },
    onunload: () => {
        // nothing left here
    }
}

function noCurrency() {
    console.error("No matches found. Make sure to use \'xxx.xx AAA\' as the format, where x is an integer and AAA is a three-letter currency code in all CAPS");
    alert("No matches found. Make sure to use \'xxx.xx AAA\' as the format, where x is an integer and AAA is a three-letter currency code in all CAPS");
}

function sendConfigAlert(key) {
    if (key == "API") {
        alert("Please enter your API key in the configuration settings via the Roam Depot tab.");
    } else if (key == "curr") {
        alert("Please enter your base currency in the configuration settings via the Roam Depot tab.");
    } else if (key == "curr2") {
        alert("Please enter a standard three-letter currency code in configuration settings via the Roam Depot tab.");
    } else if (key == "rePref") {
        alert("Please enter either inline or end in the configuration settings via the Roam Depot tab.");
    }
}