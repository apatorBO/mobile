/**
 * @name chartService 
 * @author Amin Marashi
 * @contributors []
 * @since 11/25/2015
 * @copyright Binary Ltd
 */

angular
	.module('binary')
	.service('chartService',
		function() {
			/*
				LocalHistory(capacity<history capacity in ticks>)
			*/
			var LocalHistory = function LocalHistory(capacity){
				/* 
					historyData is initialized with a call to get `capacity' number of past prices,
					after the initialization this historyData only gets updates from ticks
				*/
				var historyData = []; 

				// Usage: addTick(tick:<tick object>);
				var addTick = function addTick(tick){
					historyData.push({
						time: tick.epoch,
						price: tick.quote
					});
					historyData.shift();
				};


				// Usage: updateHistoryArray(historyArray, history:<history object>);
				var updateHistoryArray = function updateHistoryArray(historyArray, history){
					var times = history.times, 
							prices = history.prices;
					times.forEach(function(time, index){
						historyArray.push({
							time: time,
							price: prices[index] 
						});
					});
				};
				// Usage: addHistory(history:<history object>);
				var addHistory = function addHistory(history){
					updateHistoryArray(historyData, history);
				};
				
				var findElementByAttr = function findElementByAttr(array, attr, expected, compare) {
					if (!compare) {
						compare = function compare(a, b){
							return (a==b)?true:false;
						}
					}
					var foundIndex = -1;
					for (var i = 0; i < array.length; i++ ) {
						if (array[i].hasOwnProperty(attr) && compare(array[i][attr], expected)) {
							foundIndex = i;
						}
					}
					return foundIndex;
				};
			
				// Usage: addCandles(candles:<candle object>);
				var addCandles = function addCandles(candles){
					// addCandles definition here
				};

				// Usage: addOhlc(ohlc:<ohlc object>);
				var addOhlc = function addOhlc (ohlc){
					// addCandles definition here
				};

				// Functions to retrieve history data
				// Usage: getHistory(dataIndex, count, callback<function>);
				var getHistory = function getHistory(dataIndex, count, callback) {
					var end = capacity - dataIndex,
							start = end - count;
					if ( start >= 0 ) {
						callback( historyData.slice( start, end ) );
					} else {
						callback( [] );
					}
				};

				return {
					getHistory: getHistory, 
					addTick: addTick,
					addHistory: addHistory,
					addCandles: addCandles,
					addOhlc: addOhlc
				};

			};

			var localHistory;

			var makeChart = function makeChart(chartID) {
				var dataIndex = 0, 
						capacity = 600,
						initialPageTickCount = 15,
						updateEnabled = true,
						dragEnabled = true,
						pageTickCount = initialPageTickCount;

				var getTickTime = function getTickTime(tick) {
					var date = new Date(tick*1000), 
							dateString = date.toLocaleTimeString();
					return dateString.slice(0, dateString.length-3);
				}

				var chart = c3.generate({
					bindto: chartID,
					transition: {
						duration: 0
					},
					interaction: {
						enabled: false
					},
					size: {
						height: 150
					},
					data: {
						labels: {
							format: function(v, id, i, j) {
								if (pageTickCount == initialPageTickCount){
									if (pageTickCount - 1 == i) {
										return v;
									}
								} else if ((pageTickCount - i - 1)%Math.ceil(pageTickCount/5) == 0) {
									return v;
								}
							}
						},
						x: 'time',
						columns: [
							['time'],
							['price']
						],
						color: function (color, d) {
							if (d.index == pageTickCount - 1 && dataIndex == 0){
								return 'green';
							}	else {
								return 'orange';
							}
						}
					},
					legend: {
						show: false
					},
					axis: {
						x: {
							padding: {
								left: 1,
								right: 1,
							},
							show: true,
							tick: {
								culling: {
									max: 7
								},
								format: getTickTime
							} 
						},
						y: {
							show: false
						}
					}
				});
			
				var dragStart = function dragStart(){
					updateEnabled = false;
				};

				var dragEnd = function dragEnd(){
					updateEnabled = true;
				};

				var zoomStart = function zoomStart(){
					updateEnabled = false;
					dragEnabled = false;
				};

				var zoomEnd = function zoomEnd(){
					updateEnabled = true;
					dragEnabled = true;
				};
			
				// Usage: updateChartForHistory(ticks:<result array of getHistory call from localHistory>);
				var updateChartForHistory = function updateChartForHistory(ticks){
					var times = []
							prices = [],
							gridsX = [],
							gridsY = [];
					ticks.forEach(function(tick){
						gridsX.push({value: parseInt(tick.time)});
						times.push(parseInt(tick.time));
						prices.push(parseFloat(tick.price));
					});
					chart.load({
						columns: [
							['time'].concat(times),
							['price'].concat(prices)
						]
					});
					var firstPrice = Math.min.apply(Math, prices),
							lastPrice = Math.max.apply(Math, prices),
							priceStep = ((lastPrice - firstPrice)/(gridsX.length/2));
					for (var i = firstPrice; i<lastPrice + priceStep/2 ; i+=priceStep){
						gridsY.push({value: i});
					}
					chart.xgrids(gridsX);
					chart.ygrids(gridsY);
				};
				
				// Usage: addTick(tick:<tick object>);
				var addTick = function addTick(tick){
					if (localHistory) {
						localHistory.addTick(tick);
						if ( updateEnabled ) {
							localHistory.getHistory(dataIndex, pageTickCount, updateChartForHistory);
						}
					}
				};

				// Usage: addHistory(history:<history object>);
				var addHistory = function addHistory(history){
					// initialize the localHistory
					if (!localHistory) {
						localHistory = LocalHistory(capacity);
						localHistory.addHistory(history);
					}
					localHistory.getHistory(dataIndex, pageTickCount, updateChartForHistory);
				};

				// Usage: addCandles(candles:<candle object>);
				var addCandles = function addCandles(candles){
					// addCandles definition here
				};

				// Usage: addOhlc(ohlc:<ohlc object>);
				var addOhlc = function addOhlc (ohlc){
					// addCandles definition here
				};
					
				
				var zoomOut = function zoomOut(){
					if ( pageTickCount < initialPageTickCount ){
						pageTickCount++;						
						localHistory.getHistory(dataIndex, pageTickCount, updateChartForHistory);
					}
				};

				var zoomIn = function zoomIn(){
					if ( pageTickCount > 5 ){
						pageTickCount--;						
						localHistory.getHistory(dataIndex, pageTickCount, updateChartForHistory);
					}
				};

				var first = function first(){
					dataIndex = 0;
					localHistory.getHistory(dataIndex, pageTickCount, updateChartForHistory);
				};

				var next = function next(){
					if ( dragEnabled && dataIndex + pageTickCount < capacity - 2){
						dataIndex += 2;
						localHistory.getHistory(dataIndex, pageTickCount, updateChartForHistory);
					}
				};

				var previous = function previous(){
					if (dragEnabled && dataIndex > 1){
						dataIndex -= 2;
						localHistory.getHistory(dataIndex, pageTickCount, updateChartForHistory);
					}
				};

				var getCapacity = function getCapacity() {
					return capacity;
				};

				var historyInterface = {
					addTick: addTick,
					addHistory: addHistory,
					addCandles: addCandles,
					addOhlc: addOhlc
				};
				return {
					dragStart: dragStart,
					dragEnd: dragEnd,
					zoomIn: zoomIn,
					zoomOut: zoomOut,
					zoomStart: zoomStart,
					zoomEnd: zoomEnd,
					first: first,
					next: next,
					previous: previous,
					getCapacity: getCapacity,
					historyInterface: historyInterface
				};
			};
			this.makeChart = makeChart;	
	});
