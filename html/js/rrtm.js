// ===================
// = Style Variables =
// ===================
var headerHeight = 100
var flowHeight = 320
var bottomMargin = 60
var totalHeight = headerHeight + flowHeight + bottomMargin
$('svg#rrtm').height(totalHeight)

var outputWidth = 500
var totalWidth = 1250
$('svg#rrtm').width(totalWidth)
var rightMargin = 0
var altitudeAxis = 40
var inputWidth = totalWidth - (outputWidth + rightMargin + 2 * altitudeAxis)
$('text.inputDescription tspan').attr('x', inputWidth / 2)
$('text.output').attr('x', inputWidth + outputWidth/2)
var subsectionMargin = 20
var subsectionWidth = (outputWidth - (subsectionMargin * 2)) / 3.0
var profileWidth = 180
var roomForProfileLabels = 40

var arrowHeight = 40 // 60
var arrowHeadHeight = 15
var arrowHeadExtraWidthDefault = 20
var maxFlux = 1000

// ==============
// = Model Data =
// ==============

var modelData = {}

// AJAX call to update modelData object,
// inputs, and visualization
updateModel = function(initialize) {
    $.ajax({
        url: '../cgi-bin/rrtm.py',
        type: 'post',
        data: JSON.stringify(modelData),
        dataType: 'json',
        success: function(response) {
            modelData = response
            // updateInput()
            updateOutput()
            if (initialize) {
                initializeInput()
            }
        },
        error: function(x,s,e) {
            // alert('hi')
            console.log(x.error())
        }
    })
}

updateModel(true)

updateOutput = function() {
    var vis = d3.select('svg#rrtm')
    
    if (modelData['net_toa'] < 0) {
        var toa = '...then the Earth loses energy at a rate of ' + Math.abs(modelData['net_toa']) + ' W/m2.'
    } else {
        if (modelData['net_toa'] > 0) {
            var toa = '...then the Earth gains energy at a rate of ' + Math.abs(modelData['net_toa']) + ' W/m2.'
        } else {
            var toa = "...then the Earth loses as much energy as it gains."
        }
    }
    $('text.output').text('').append(toa)
    
    d3.select('g.output').remove()
    var g = vis.append('svg:g')
        .attr('class', 'output')
        .attr('transform', 'translate(' + (inputWidth + altitudeAxis) + ', ' + headerHeight + ')')
    var list = ['shortwave', 'longwave', 'total']
    var json = {
        'shortwave': {
            'downward': modelData['swdflx'],
            'upward': modelData['swuflx']
        },
        'longwave': {
            'downward': modelData['lwdflx'],
            'upward': modelData['lwuflx']
        },
        'total': {
            'downward': modelData['dflx'],
            'upward': modelData['uflx']
        }
    }
    
    list.map(function(lightType,i) {
        var downLayer = json[lightType].downward.map(function(d, i) {return {x: i, y: d}});
        var upLayer = json[lightType].upward.map(function(d, i) {return {x: i, y: d}});
        offset = function(data) { return data[0].map(function(d,i) { return - d[1] });}
        var layers = d3.layout.stack().offset(offset)([downLayer, upLayer]);
        
        var x = d3.scale.linear().domain([-maxFlux, maxFlux]).range([
            i * (subsectionWidth + subsectionMargin),
            i * (subsectionWidth + subsectionMargin) + subsectionWidth
        ]);
        var y = d3.scale.linear().domain([0, d3.max(modelData['altitude'])]).range([flowHeight, 0])

          var area = d3.svg.area()
              .x0(function(d) { return x(d.y0); })
              .x1(function(d) { return x(d.y0 + d.y); })
              .y(function(d,i) { return y(i && modelData['altitude'][i - 1]); });

          g.selectAll("path." + lightType)
              .data(layers)
            .enter().append("path")
              .attr("d", area)
              .attr('class', lightType)
              .style("fill", function(d, i) { return ['rgb(249,152,0)', 'rgb(228,105,0)'][i]; });

              // Arrows
              var leftExtent = x(layers[0][0].y0)
              var rightExtent = x(layers[0][0].y0 + layers[0][0].y)
            var arrowHeadExtraWidth = d3.min([rightExtent - leftExtent, arrowHeadExtraWidthDefault]) // arrowHeadExtraWidthDefault
              var downArrowPoints = [
                  {'x': leftExtent, 'y': flowHeight}, //+verticalMargin-arrowHeight},
                  {'x': leftExtent, 'y': flowHeight-arrowHeadHeight+arrowHeight},
                  {'x': leftExtent - arrowHeadExtraWidth, 'y': flowHeight-arrowHeadHeight+arrowHeight},
                  {'x': leftExtent + (rightExtent - leftExtent) / 2, 'y': flowHeight+arrowHeight},
                  {'x': rightExtent + arrowHeadExtraWidth, 'y': flowHeight-arrowHeadHeight+arrowHeight},
                  {'x': rightExtent, 'y': flowHeight-arrowHeadHeight+arrowHeight},
                  {'x': rightExtent, 'y': flowHeight} //-arrowHeight+verticalMargin}
              ]
              
              g.selectAll("polygon." + lightType + 'DownArrow')
                  .data([downArrowPoints])
                .enter().append("polygon")
                  .attr("points",function(d) { 
                      return d.map(function(d) {
                          return [d.x,d.y].join(",");
                      }).join(" ");
                  })
                  .style("fill", 'rgb(249,152,0)')
                  .attr('class', lightType + 'DownArrow');
        
                  var leftExtent = x(layers[1][layers[1].length-1].y0)
                  var rightExtent = x(layers[1][layers[1].length-1].y0 + layers[1][layers[1].length-1].y)
                  var arrowHeadExtraWidth = d3.min([rightExtent - leftExtent, arrowHeadExtraWidthDefault]) // arrowHeadExtraWidthDefault 
                  var upArrowPoints = [
                      {'x': leftExtent, 'y': 0},
                      {'x': leftExtent, 'y': arrowHeadHeight-arrowHeight},
                      {'x': leftExtent - arrowHeadExtraWidth, 'y': arrowHeadHeight-arrowHeight},
                      {'x': leftExtent + (rightExtent - leftExtent) / 2, 'y': -arrowHeight},
                      {'x': rightExtent + arrowHeadExtraWidth, 'y': arrowHeadHeight-arrowHeight},
                      {'x': rightExtent, 'y': arrowHeadHeight-arrowHeight},
                      {'x': rightExtent, 'y': 0}
                  ]
              
                  g.selectAll("polygon." + lightType + 'UpArrow')
                      .data([upArrowPoints])
                    .enter().append("polygon")
                      .attr("points",function(d) { 
                          return d.map(function(d) {
                              return [d.x,d.y].join(",");
                          }).join(" ");
                      })
                      .style("fill", 'rgb(228,105,0)')
                      .attr('class', lightType + 'UpArrow');
                      
                      // add axes
                          var xAxis = d3.svg.axis()
                              .scale(x)
                              .orient('bottom')
                              .ticks(5)
                              .tickFormat(function(d) {return Math.abs(d)});
        
                          g.append('g')
                              .attr('class', 'axis')
                              .attr('transform', 'translate(0,' + flowHeight + ')')
                              .call(xAxis)
                              
                      var xTopAxis = d3.svg.axis()
                          .scale(x)
                          .orient('top')
                          .ticks(5)
                        .tickFormat(function(d) {return Math.abs(d)});

                      g.append('g')
                          .attr('class', 'axis')
                          .attr('transform', 'translate(0,0)')
                          .call(xTopAxis)

                          g.append('text')
                          .attr('class', 'x label')
                          .attr('text-anchor', 'middle')
                          .attr('fill', '#434358')
                          .attr('x', leftExtent)
                          .attr('y', -47) //23)
                          .text(lightType + ' energy (W/m2)');

                          g.append('text')
                          .attr('class', 'x label')
                          .attr('text-anchor', 'middle')
                          .attr('fill', '#434358')
                          .attr('x', leftExtent)
                          .attr('y', flowHeight + 50) // 30)
                          .text(lightType + ' energy (W/m2)');
    })
}

// =========
// = Input =
// =========

var mouseDown = false
var changed = false
// var profileMove = false
$('svg').on("mousedown", function(e) {
    mouseDown = true
})
$('body').on("mouseup", function(e) {
    mouseDown = false
    // profileMove = false
    if (changed) {
        updateModel()
        changed = false
    }
})

closestLayerIndex = function(altitude) {
    var closest = 0
    var previous = 0
    $.each(modelData['altitude'], function(i,d) {
        if (altitude < (previous + (d - previous) / 2)) {
            return false
        } else {
            closest = i
            previous = d
        }
    })
    return closest
}

var drag = d3.behavior.drag()
    .on("drag", function(d,i) {        
        var args = this.__data__[0]
        var g = this.__data__[1]

        var xvalue = d3.mouse(this)[0]
        if (args.hardMax) {
            var newValue = args.x.invert(Math.min(Math.max(xvalue, 0), profileWidth))
        } else {
            var newValue = args.x.invert(Math.max(xvalue, 0))                
        }

        var diff = newValue - args.values[0]
        args.values.map(function(oldValue, index) {
            args.values[index] = oldValue + diff
            if (args.surfaceKey && (index == 0)) {
                modelData[args.surfaceKey] = oldValue + diff
            } else {
                modelData[args.nonSurfaceKey][index - 1] = oldValue + diff
            }
        })

        args.profile.remove()
        args['profile'] = g.append('svg:path').attr('class', 'profile').attr('d', args.line(args.values))
        d3.select(this).attr('cx', args.x(args.values[0]))
    })
    .on("dragend", function(d,i){
        updateModel()
    });


initializeInput = function() {
    $('.input').attr('height', (flowHeight + bottomMargin) + 'px').attr('width', inputWidth + 'px')
    $('foreignObject.input').attr('y', headerHeight).attr('x', altitudeAxis)
    $('svg#inner').attr('height', (flowHeight + roomForProfileLabels) + 'px')
    
    
    var y = d3.scale.linear().domain([0, d3.max(modelData['altitude'])]).range([flowHeight, 0])
    
    // Axes
    var yAxis = d3.svg.axis()
        .scale(y)
        .orient('left')
        .ticks(5)
        
    var yRightAxis = d3.svg.axis()
        .scale(y)
        .orient('right')
        .ticks(5)
    
    var vis = d3.select('svg#rrtm')
    var g = vis.append("svg:g")
        .attr('class', 'input').attr('transform', 'translate(' + 0 + ', ' + headerHeight + ')');
    
    g.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + altitudeAxis + ',0)')
        .call(yAxis)

    g.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(' + (altitudeAxis + inputWidth + outputWidth) + ',0)')
        .call(yRightAxis)
    
    g.append('text')
          .attr('fill', '#434358')
        .attr('class', 'y label').attr('text-anchor', 'middle').attr('y', 0)
        .attr('x', -flowHeight / 2).attr('dy', '.75em').attr('transform', 'rotate(-90)')
        .text('altitude (km)')

    g.append('text')
          .attr('fill', '#434358')
        .attr('class', 'y label').attr('text-anchor', 'middle').attr('y', -(inputWidth+outputWidth+(2*altitudeAxis)))
        .attr('x', flowHeight / 2).attr('dy', '.75em').attr('transform', 'rotate(90)')
        .text('altitude (km)')
    
    g.append('line')
        .attr("x1", altitudeAxis)
        .attr("y1", 0)
        .attr("x2", altitudeAxis + inputWidth + outputWidth)
        .attr("y2", 0)

    g.append('line')
        .attr("x1", altitudeAxis)
        .attr("y1", flowHeight)
        .attr("x2", altitudeAxis + inputWidth + outputWidth)
        .attr("y2", flowHeight)

    list = [
        {nonSurfaceKey: 'Tbound', surfaceKey: 'Ts', min: 150, max: 350, label: 'Temperature (K)'},
        {nonSurfaceKey: 'rh', max: 100., label: 'relative humidity (%)'},
        {nonSurfaceKey: 'co2', max: 3000, label: 'CO2 (ppm)'},
        {nonSurfaceKey: 'ch4', max: 10000, label: 'CH4 (ppb)'},
        {nonSurfaceKey: 'n2o', max: 1000, label: 'N2O (ppb)'},
        {nonSurfaceKey: 'o3', max: 50, label: 'O3 (ppm)'},
        {nonSurfaceKey: 'cfc11', max: 1000, label: 'CFC-11 (ppt)'},
        {nonSurfaceKey: 'cfc12', max: 1000, label: 'CFC-12 (ppt)'},
        {nonSurfaceKey: 'cfc22', max: 1000, label: 'CFC-22 (ppt)'},
        {nonSurfaceKey: 'ccl4', max: 50, label: 'CCl4 (ppt)'},
        {nonSurfaceKey: 'cldf', max: 1, label: 'Cloud fraction'},
        {nonSurfaceKey: 'clwp', max: 30, label: 'In-cloud liquid water path (g/m2)'},
        {nonSurfaceKey: 'r_liq', max: 100, label: 'Cloud water drop radius (10^-6 m)'},
        {nonSurfaceKey: 'ciwp', max: 30, label: 'In-cloud ice water path (g/m2)'},
        {nonSurfaceKey: 'r_ice', max: 130, min: 13, label: 'Cloud ice particle radius (10^-6 m)'},
        {nonSurfaceKey: 'tauaer_sw', max: 3, label: 'Aerosol SW optical depth'},
        {nonSurfaceKey: 'ssaaer_sw', max: 1, label: 'Aerosol SW s.s. albedo'},
        {nonSurfaceKey: 'asmaer_sw', max: 1, min: -1, label: 'Aerosol SW asymm. scattering'},
        {nonSurfaceKey: 'tauaer_lw', max: 3, label: 'Aerosol LW optical depth'}
    ]
    
    var vis = d3.select('svg#inner')
    
    
    $('svg#inner')
        .attr('width', (list.length * profileWidth + (list.length - 1) * subsectionMargin) + 'px')

    list.map(function(args, i) {
        var g = vis.append('svg:g')
                .attr('class', args.nonSurfaceKey)
        
        if (i) {
            g.append('rect')
                .attr('width', subsectionMargin)
                .attr('height', flowHeight)
                .attr('x', (profileWidth + subsectionMargin) * i - subsectionMargin)
                .attr('fill', '#DDD')
        }
                
        args['x'] = d3.scale.linear().domain([args.min || 0, args.max]).range([(profileWidth + subsectionMargin) * i, (profileWidth + subsectionMargin) * i + profileWidth])
        args['line'] = d3.svg.line().x(function(d) { return args.x(d); }).y(function(d,i) { return y(i && modelData['altitude'][i - 1]); })
        args['values'] = ([typeof args.surfaceKey !== 'undefined' ? modelData[args.surfaceKey] : modelData[args.nonSurfaceKey][0]]).concat(modelData[args.nonSurfaceKey])
        args['profile'] = g.append('svg:path').attr('class', 'profile').attr('d', args.line(args.values))
        
        var xAxis = d3.svg.axis()
            .scale(args.x)
            .orient('bottom')
            .ticks(5)
            .tickFormat(function(d) {return d});
        
        g.append('g')
            .attr('class', 'axis')
            .attr('transform', 'translate(0,' + flowHeight + ')')
            .call(xAxis)
            
        g.append('text')
            .attr('class', 'x label')
            .attr('text-anchor', 'middle')
          .attr('fill', '#434358')
            .attr('x', (profileWidth + subsectionMargin) * i + profileWidth / 2)
            .attr('y', flowHeight + 30)
            .text(args.label)
        
        g.selectAll('circle')
        .data([[args, g]])
        .enter()
        .append('circle')
        .attr('class', 'controller')
        .attr('cx', args.x(args.values[0]))
        .attr('cy', flowHeight + 5)
        .attr('r', 5)
        .attr('fill', '#b94a48')
        .call(drag)
        // .attr('fill', 'blue').on('mousedown', function(d,j) {
        //     // profileMove = [args, g]
        //     return false
        // })

    })
    vis.on("mousemove", function(d,j) {
        if ((mouseDown && (d3.mouse(this)[1] < flowHeight)) && (d3.mouse(this)[0] % (profileWidth + subsectionMargin) < profileWidth)) {
            var xindex = Math.floor(d3.mouse(this)[0] / (profileWidth + subsectionMargin))
            args = list[xindex]
            
            var g = d3.select('g.' + args.nonSurfaceKey)
            
            var ci = closestLayerIndex(y.invert(d3.mouse(this)[1]))
            var xvalue = d3.mouse(this)[0]
            if (args.hardMax) {
                var newValue = args.x.invert(Math.min(Math.max(xvalue, 0), profileWidth))
            } else {
                var newValue = args.x.invert(Math.max(xvalue, 0))                
            }
            
            // Up to here
            args.values[ci] = newValue
            if (!ci) {
                g.select('circle').attr('cx', args.x(args.values[0]))
            }
            args.profile.remove()
            args['profile'] = g.append('svg:path').attr('class', 'profile').attr('d', args.line(args.values))
            if ((args.surfaceKey) && (ci == 0)) {
                modelData[args.surfaceKey] = newValue
            } else {
                // if ((key == '#cldf') && (modelData[args.nonSurfaceKey][ci - 1] == 0)) {
                //     $.each([['clwp', 5.0], ['ciwp', 5.0], ['r_liq', 10.0], ['r_ice', 30.0]], function(i,d) {
                //         var new_key = d[0]
                //         var new_default = d[1]
                // 
                //         if (modelData[new_key][ci - 1] == 0) {
                //             modelData[new_key][ci - 1] = new_default
                //         }
                //     })
                // }
                modelData[args.nonSurfaceKey][ci - 1] = newValue
            }
            changed = true
        }
        return false
    })
}