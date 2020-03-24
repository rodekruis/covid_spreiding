// Helper function
var lookup = function(collection, attribute, field) {
    var lookup = {};

    collection.forEach(function(e) {
        lookup[e[attribute]] = String(e[field]);
    });

    return lookup;
}
var lookupGeo = function(collection, attribute, field) {
    var lookup = {};

    collection.forEach(function(e) {
        lookup[e.properties[attribute]] = String(e.properties[field]);
    });

    return lookup;
}


///////////////////   
// Main function //
///////////////////

// Load mapping between gemeentes and Veiligheidregios/DACs
d3.dsv(',')('data/map_gemeente_VR.csv', function(mapping_gemeente_VR){

    var mapping = lookup(mapping_gemeente_VR, "gemeentecode", "dac_code");

    // Load cases-data (automatically updated)
    d3.dsv(',')("https://raw.githubusercontent.com/J535D165/CoronaWatchNL/master/data/rivm_corona_in_nl.csv", function(cases_data){

        // Load shape-data
        d3.json("data/dac.geojson", function (veiligheidsregioJSON) {

            var nameLookup = lookupGeo(veiligheidsregioJSON.features, "code_DAC", "dac_naam");
        
            // Find latest update-date and add DAC-code to cases-data
            var max_date = cases_data[0]['Datum'];
            cases_data.forEach(function(e) {
                e['veiligheidsregio'] = mapping[e['Gemeentecode']];
                if (e['Datum'] > max_date) {
                    max_date = e['Datum'];
                }
            })
            document.getElementById('update-date').innerHTML = max_date;
        
            // Set up crossfilter                
            var cf = crossfilter(cases_data);
            cf.veiligheidsregio = cf.dimension(function(d) {return d.veiligheidsregio == 'undefined' ? 'Onbekend' : d.veiligheidsregio; });
            cf.veiligheidsregio_row = cf.dimension(function(d) {return d.veiligheidsregio == 'undefined' ? 'Onbekend' : d.veiligheidsregio; });
            cf.datum = cf.dimension(function(d) { return d.Datum; });
            var veiligheidsregio = cf.veiligheidsregio.group().reduceSum(function(d) {return d.Aantal;});
            var veiligheidsregio_row = cf.veiligheidsregio_row.group().reduceSum(function(d) {return d.Aantal;});
            var datum = cf.datum.group().reduceSum(function(d) {return d.Aantal;});
            // Filter cases by current_date (as they are cumulative)
            cf.datum.filter(max_date);
                
            var all = cf.groupAll().reduceSum(function(d) {return d.Aantal;});
            dc.dataCount("#count-info")
                .dimension(cf)
                .group(all);
            
            console.log(veiligheidsregio.top(Infinity));
            
            var date_chart = dc.rowChart("#dates");
            date_chart.width(500).height(300)
                    .dimension(cf.datum)
                    .group(datum)
                    .elasticX(true)
                    .data(function(group) {
                        return group.top(7);
                    })
                    .colors(['#a60000'])
                    .colorDomain([0,0])
                    .colorAccessor(function(d, i){return 1;}) 
                    .ordering(function (d) {
                        return d.key;
                    })
            ;

            var dac_row_chart = dc.rowChart("#dac_row");
            dac_row_chart.width(300).height(600)
                    .dimension(cf.veiligheidsregio_row)
                    .group(veiligheidsregio_row)
                    .elasticX(true)
                    .colorCalculator(function(){return '#a60000';}) 
                    .label(function(d) {
                        return nameLookup[d.key] + ' (' + d.key + ') : ' + d.value + ' gevallen';
                    })
                    .title(function(d) {
                        return nameLookup[d.key] + ' (' + d.key + ') : ' + d.value + ' gevallen';
                    })
                    .ordering(function (d) {
                        return d.key;
                    })
            ;
            
            // THIS CODE WAS USED TO PRODUCED THE HARD-CODED SVG IN INDEX.HTML
            // var map_chart = dc.geoChoroplethChart("#map");
            // map_chart
            //     .width(660).height(800)
            //     .dimension(cf.veiligheidsregio)
            //     .group(veiligheidsregio)
            //     .colors(d3.scale.quantile()
            //                     .domain([1,5000])
            //                     .range(['#E5CF00','#DDA509','#D57C12','#CE521B','#C62924','#BF002D']))
            //     .colorCalculator(function (d) { return '#cccccc'; })
            //     .overlayGeoJson(veiligheidsregioJSON.features, "Veiligheidsregio", function (d) {
            //         return d.properties.code;
            //     })
            //     .projection(d3.geo.mercator().center([6,52.5]).scale(8000))
            //     .title(function (d) {
            //         return '';
            //     });
                
            var bubbleOverlayChart = new dc.bubbleOverlay("#map")
                .svg(d3.select("#map svg"));
            
            bubbleOverlayChart
                .width(660)
                .height(800)
                .dimension(cf.veiligheidsregio)
                .group(veiligheidsregio)
                .radiusValueAccessor(function(d) {
                    return d.value*d.value;
                })
                .r(d3.scale.linear().domain([0, 3000000]))
                .colorCalculator(function() {
                    return "#a60000";
                })
                .label(function(d) {
                    return d.value;
                })
                .title(function(d) {
                    return nameLookup[d.key] + ' (' + d.key + ') : ' + d.value + ' gevallen';
                })
                .point('DAC01',605.029074985776,104.373029151741)
                .point('DAC02',467.326770767702,127.409735846573)
                .point('DAC03',586.086023017136,181.084517206379)
                .point('DAC04',527.636906482752,249.596889456433)
                .point('DAC05',599.677997236313,299.546833843589)
                .point('DAC06',519.331207026812,334.914970668994)
                .point('DAC07',460.966249567539,359.135488008)
                .point('DAC08',410.50761280771,398.76118558307)
                .point('DAC09-14',362.122407508479,344.633646607006)
                .point('DAC10-11',320.6353464998,212.700445602315)
                .point('DAC12',284.524098450637,287.046450896627)
                .point('DAC13',317.963685562659,295.235850717989)
                .point('DAC15',235.790050070713,358.359161952693)
                .point('DAC16',283.302708872666,345.163913656368)
                .point('DAC17',225.892479300152,397.80554790253)
                .point('DAC18',284.057897395095,407.66181852413)
                .point('DAC19',158.715067723556,485.70340981693)
                .point('DAC20',298.498886726115,457.018389812325)
                .point('DAC21',422.603250453714,439.073785624001)
                .point('DAC22',416.904912986926,493.60364853546)
                .point('DAC23',485.65751704495,508.82325444493)
                .point('DAC24',470.019277481631,608.908100632476)
                .point('DAC25',428.817693793678,253.607010168887) 
            ;
                
            dc.renderAll();
                                            
        });      

    })
});