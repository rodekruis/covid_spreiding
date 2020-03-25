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
            //     .width(660).height(660)
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

            var max_cases = veiligheidsregio.top(1)[0].value;
            var factor = 3000000 / 677;
                
            var bubbleOverlayChart = new dc.bubbleOverlay("#map")
                .svg(d3.select("#map svg"));
            
            bubbleOverlayChart
                .width(660)
                .height(660)
                .dimension(cf.veiligheidsregio)
                .group(veiligheidsregio)
                .radiusValueAccessor(function(d) {
                    return d.value*d.value;
                })
                .r(d3.scale.linear().domain([0, max_cases * factor]))
                .colorCalculator(function() {
                    return "#a60000";
                })
                .label(function(d) {
                    return d.value;
                })
                .title(function(d) {
                    return nameLookup[d.key] + ' (' + d.key + ') : ' + d.value + ' gevallen';
                })
                .point('DAC01',605.029074985776,102.773764995383)
                .point('DAC02',467.326770767702,125.457489894085)
                .point('DAC03',586.086023017136,178.309835087894)
                .point('DAC04',527.636906482752,245.772420988956)
                .point('DAC05',599.677997236313,294.957003325018)
                .point('DAC06',519.331207026812,329.783209021647)
                .point('DAC07',460.966249567539,353.632605530458)
                .point('DAC08',410.50761280771,392.651135158814)
                .point('DAC09-14',362.122407508479,339.352969763834)
                .point('DAC10-11',320.6353464998,209.441325871312)
                .point('DAC12',284.524098450637,282.648158503856)
                .point('DAC13',317.963685562659,290.71207558602)
                .point('DAC15',235.790050070713,352.868174793741)
                .point('DAC16',283.302708872666,339.875111753569)
                .point('DAC17',225.892479300152,391.710140313702)
                .point('DAC18',284.057897395095,401.415387433841)
                .point('DAC19',158.715067723556,478.261180150381)
                .point('DAC20',298.498886726115,450.015688678104)
                .point('DAC21',422.603250453714,432.346042134601)
                .point('DAC22',416.904912986926,486.04036682403)
                .point('DAC23',485.65751704495,501.026769094564)
                .point('DAC24',470.019277481631,599.578057155043)
                .point('DAC25',428.817693793678,249.721096303396)
            ;
                
            dc.renderAll();
                                            
        });      

    })
});