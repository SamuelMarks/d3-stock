/* global d3, _ */

(() => {
    const type = d => ({
        date: parseDate(d.Date),
        price: +d.Close,
        average: +d.Average,
        volume: +d.Volume,
    });

    const margin = {top: 30, right: 20, bottom: 100, left: 50},
        margin2 = {top: 210, right: 20, bottom: 20, left: 50},
        width = 764 - margin.left - margin.right,
        height = 283 - margin.top - margin.bottom,
        height2 = 283 - margin2.top - margin2.bottom;

    const parseDate = d3.timeParse('%d/%m/%Y'),
        bisectDate = d3.bisector(d => d.date).left,
        legendFormat = d3.timeFormat('%b %d, %Y');

    const x = d3.scaleTime().range([0, width]),
        x2 = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        y2 = d3.scaleLinear().range([height2, 0]),
        y3 = d3.scaleLinear().range([60, 0]);

    const xAxis = d3.axisBottom(x),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y);

    const priceLine = d3.line()
        .curve(d3.curveMonotoneX)
        .x(d => x(d.date))
        .y(d => y(d.price));

    const avgLine = d3.line()
        .curve(d3.curveMonotoneX)
        .x(d => x(d.date))
        .y(d => y(d.average));

    const area2 = d3.area()
        .curve(d3.curveMonotoneX)
        .x(d => x2(d.date))
        .y0(height2)
        .y1(d => y2(d.price));

    const svg = d3.select('body').append('svg')
        .attr('class', 'chart')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom + 60);

    svg.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height);

    const make_y_axis = () => d3.axisLeft(y).ticks(3);

    const focus = svg.append('g')
        .attr('class', 'focus')
        .attr('transform', `translate(${margin.left} , ${margin.top})`);

    const barsGroup = svg.append('g')
        .attr('class', 'volume')
        .attr('clip-path', 'url(#clip)')
        .attr('transform', `translate(${margin.left}, ${margin.top + 60 + 20} )`);

    const context = svg.append('g')
        .attr('class', 'context')
        .attr('transform', `translate(${margin2.left} , ${margin2.top + 60})`);

    const legend = svg.append('g')
        .attr('class', 'chart__legend')
        .attr('width', width)
        .attr('height', 30)
        .attr('transform', `translate(${margin2.left}, 10)`);

    const dateLegend = svg.append('g')
        .attr('class', 'chart__dateLegend')
        .attr('width', width)
        .attr('height', 30)
        .style('text-anchor', 'middle')
        .style('display', 'none');

    const dateLegendBackground = dateLegend.append('rect')
        .attr('class', 'chart__dateLegendBackground')
        .attr('width', 70)
        .attr('height', 20)
        .attr('x', -35)
        .attr('y', -10)
        .attr('rx', 10);

    const dateLegendText = dateLegend.append('text')
        .attr('class', 'chart__dateLegendText')
        .attr('y', 3);

    legend.append('text')
        .attr('class', 'chart__symbol')
        .text('NASDAQ: AAPL');

    const rangeSelection = legend
        .append('g')
        .attr('class', 'chart__range-selection')
        .attr('transform', 'translate(110, 0)');

    d3.csv('https://raw.githubusercontent.com/arnauddri/d3-stock/master/src/data/aapl.csv', type, (err, data) => {
        const focusOnRange = range => {
            const today = new Date(data[data.length - 1].date);
            const ext = new Date(data[data.length - 1].date);

            if (range === '1m')
                ext.setMonth(ext.getMonth() - 1);

            if (range === '1w')
                ext.setDate(ext.getDate() - 7);

            if (range === '3m')
                ext.setMonth(ext.getMonth() - 3);

            if (range === '6m')
                ext.setMonth(ext.getMonth() - 6);

            if (range === '1y')
                ext.setFullYear(ext.getFullYear() - 1);

            if (range === '5y')
                ext.setFullYear(ext.getFullYear() - 5);

            const newSelection = [ext, today].map(x2);
            if (newSelection[0] < 0) newSelection[0] = 0;
            context.select('.brush').call(brush.move, newSelection);
        };

        function mousemove() {
            const x0 = x.invert(d3.mouse(this)[0]);
            const i = bisectDate(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            helperText.text(legendFormat(new Date(d.date)) + ' - Price: ' + d.price + ' Avg: ' + d.average);
            dateLegendText.text(legendFormat(new Date(d.date)));
            dateLegend.attr('transform', 'translate(' + (x(d.date) + margin.left) + ',' + (margin.top + height + 10) + ')');
            priceTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y(d.price) + ')');
            averageTooltip.attr('transform', 'translate(' + x(d.date) + ',' + y(d.average) + ')');
            verticalPriceLine.attr('transform', 'translate(' + x(d.date) + ', 0)');
            horizontalPriceLine.attr('transform', 'translate(0, ' + y(d.price) + ')');
        }

        const mouseArea = svg.append('g')
            .attr('class', 'chart__mouse')
            .append('rect')
            .attr('class', 'chart__overlay')
            .attr('width', width)
            .attr('height', height)
            .attr('transform', `translate(${margin.left}, ${margin.top})`)
            .on('mouseover', () => {
                helper.style('display', null);
                dateLegend.style('display', null);
                priceTooltip.style('display', null);
                averageTooltip.style('display', null);
                verticalPriceLine.style('display', null);
                horizontalPriceLine.style('display', null);
            })
            .on('mouseout', () => {
                helper.style('display', 'none');
                dateLegend.style('display', 'none');
                priceTooltip.style('display', 'none');
                averageTooltip.style('display', 'none');
                verticalPriceLine.style('display', 'none');
                horizontalPriceLine.style('display', 'none');
            })
            .on('mousemove', mousemove);

        const brushed = () => {
            let dateExtents = d3.event.selection || x2.range();
            dateExtents = d3.event.selection.map(x2.invert, x2);

            x.domain(dateExtents);
            y.domain([
                d3.min(data.map(d => (d.date >= dateExtents[0] && d.date <= dateExtents[1]) ? d.price : max)),
                d3.max(data.map(d => (d.date >= dateExtents[0] && d.date <= dateExtents[1]) ? d.price : min))
            ]);
            range.text(legendFormat(new Date(dateExtents[0])) + ' - ' + legendFormat(new Date(dateExtents[1])));
            focusGraph.attr('x', (d, i) => x(d.date));

            const days = Math.ceil((dateExtents[1] - dateExtents[0]) / (24 * 3600 * 1000));
            focusGraph.attr('width', (40 > days) ? (40 - days) * 5 / 6 : 5);

            priceChart.attr('d', priceLine);
            averageChart.attr('d', avgLine);
            focus.select('.x.axis').call(xAxis);
            focus.select('.y.axis').call(yAxis);
        };

        const xRange = d3.extent(data.map(d => d.date));

        x.domain(xRange);
        y.domain(d3.extent(data.map(d => d.price)));
        y3.domain(d3.extent(data.map(d => d.price)));
        x2.domain(x.domain());
        y2.domain(y.domain());

        const min = d3.min(data.map(d => d.price));
        const max = d3.max(data.map(d => d.price));

        const range = legend.append('text')
            .text(legendFormat(new Date(xRange[0])) + ' - ' + legendFormat(new Date(xRange[1])))
            .style('text-anchor', 'end')
            .attr('transform', `translate(${width}, 0)`);

        focus.append('g')
            .attr('class', 'y chart__grid')
            .call(make_y_axis()
                .tickSize(-width, 0, 0)
                .tickFormat(''));

        const priceChart = focus.append('path')
            .datum(data)
            .attr('class', 'chart__line line chart__price--focus')
            .attr('d', priceLine);

        const averageChart = focus.append('path')
            .datum(data)
            .attr('class', 'chart__line chart__average--focus line')
            .attr('d', avgLine);

        focus.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0 ,' + height + ')')
            .call(xAxis);

        focus.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(0, 0)')
            .call(yAxis);

        const focusGraph = barsGroup.selectAll('rect')
            .data(data)
            .enter().append('rect')
            .attr('class', 'chart__bars')
            .attr('x', (d, i) => x(d.date))
            .attr('y', d => 155 - y3(d.price))
            .attr('width', 1)
            .attr('height', d => y3(d.price));

        const helper = focus.append('g')
            .attr('class', 'chart__helper')
            .style('text-anchor', 'end')
            .attr('transform', `translate(${width}, 0)`);

        const helperText = helper.append('text');

        const priceTooltip = focus.append('g')
            .attr('class', 'chart__tooltip--price')
            .append('circle')
            .style('display', 'none')
            .attr('r', 2.5);

        const verticalPriceLine = focus.append('g')
            .attr('class', 'chart__tooltip--price-crosshairs')
            .append('line')
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('x1', 0)
            .attr('y1', height);

        const horizontalPriceLine = focus.append('g')
            .attr('class', 'chart__tooltip--price-crosshairs')
            .append('line')
            .style('display', 'none')
            .attr('x0', 0)
            .attr('y0', 0)
            .attr('x1', width)
            .attr('y1', 0)
            .attr('stroke-width', 2)
            .attr('stroke', 'black');

        const averageTooltip = focus.append('g')
            .attr('class', 'chart__tooltip--average')
            .append('circle')
            .style('display', 'none')
            .attr('r', 2.5);

        context.append('path')
            .datum(data)
            .attr('class', 'chart__area area')
            .attr('d', area2);

        context.append('g')
            .attr('class', 'x axis chart__axis--context')
            .attr('y', 0)
            .attr('transform', `translate(0, ${height2 - 22})`)
            .call(xAxis2);

        const brush = d3.brushX().extent([[0, 0], [width, height2]]).on('end', brushed);

        context.append('g')
            .attr('class', 'x brush')
            .call(brush);

        const dateRange = ['1w', '1m', '3m', '6m', '1y', '5y'];
        for (let i = 0, l = dateRange.length; i < l; i++) {
            const v = dateRange[i];
            rangeSelection
                .append('text')
                .attr('class', 'chart__range-selection')
                .text(v)
                .attr('transform', 'translate(' + (18 * i) + ', 0)')
                .on('click', d => focusOnRange(this.textContent));
        }
    }); // end Data
})();
