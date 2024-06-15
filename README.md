This extension allows you to convert currency in your Roam Research graph into a configurable base currency.

**New:**
- added option to right-click on block dot and use the Extensions menu option
<img width="382" alt="image" src="https://github.com/mlava/currency-converter/assets/6857790/026f5fc5-7030-4141-a6a2-980eca00a383">

It uses the free API at https://currencyapi.com/ which allows for 300 conversions per month.

Simply trigger via the Commmand Palette in any block that contains a currency value. It needs to match the format xxx.yy AAA, where xxx.yy is any numerical value and AAA is a standard three-letter currency code.

The full list of available currencies is available at https://currencyapi.com/docs/currency-list.

You need to place the free API key in the configuration in Roam Depot, as well as your preferred Base Currency (local currency). Finally, you can decide whether the converted value is inserted inline or at the end of the line:
  - Inline: Today I was paid 17189.23 USD (24600.82 AUD) for some old records 
  - End: Today I was paid 17189.23 USD for some old records (24600.82 AUD) 

Here is a video showing it in action!

https://www.loom.com/share/1a84b80740f340bf88f51a01509e34dc
