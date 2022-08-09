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

        window.roamAlphaAPI.ui.commandPalette.addCommand({
            label: "Convert Currency",
            callback: () => convertCurrency()
        });

        async function convertCurrency() {
            if (!extensionAPI.settings.get("currConv-apiKey")) {
                sendConfigAlert();
            } else if (!extensionAPI.settings.get("currConv-base")) {
                sendConfigAlert();
            } else if (!extensionAPI.settings.get("currConv-replacePreference")) {
                sendConfigAlert();
            } else {
                const apiKey = extensionAPI.settings.get("currConv-apiKey");
                const baseCurrency = extensionAPI.settings.get("currConv-base");
                const replacePreference = extensionAPI.settings.get("currConv-replacePreference");

                const startBlock = await window.roamAlphaAPI.ui.getFocusedBlock()?.["block-uid"];
                let q = `[:find (pull ?page
                [:node/title :block/string ])
             :where [?page :block/uid "${startBlock}"]  ]`;
                var block = await window.roamAlphaAPI.q(q);

                if (block[0][0].string.length > 0) {
                    var text = block[0][0].string;
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
                            console.error(data.data);
                            for (const m of matches) { //regex found at least one currency to convert
                                let origValue = m[2];
                                let currency = m[3];
                                console.log(`Converting ${origValue} in ${currency} to ${baseCurrency}`);

                                for (const [key, value] of Object.entries(data.data)) {
                                    if (key == currency) {
                                        console.error(value.value);
                                        let convRate = value.value;
                                        let newValue = (origValue * (1 / convRate)).toFixed(2);
                                        if (replacePreference == "inline") {
                                            newString = newString.replace(m[1], "" + m[1] + " (" + newValue + " " + baseCurrency + ")");
                                        } else if (replacePreference == "end") {
                                            newString = newString + ' (' + newValue + ' ' + baseCurrency + ')';
                                        }
                                        window.roamAlphaAPI.updateBlock(
                                            { block: { uid: startBlock, string: newString.toString(), open: true } });
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
        };
    },
    onunload: () => {
        window.roamAlphaAPI.ui.commandPalette.removeCommand({
            label: 'Convert Currency'
        });
    }
}

function noCurrency() {
    console.error("No matches found. Make sure to use \'xxx.xx AAA\' as the format, where x is an integer and AAA is a three-letter currency code in all CAPS");
    alert("No matches found. Make sure to use \'xxx.xx AAA\' as the format, where x is an integer and AAA is a three-letter currency code in all CAPS");
}

function sendConfigAlert() {
    alert("Please set all required configuration settings via the Roam Depot tab.");
}