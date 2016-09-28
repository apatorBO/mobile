/**
 * @name profit-table controller
 * @author Nazanin Reihani Haghighi
 * @contributors []
 * @since 08/14/2016
 * @copyright Binary Ltd
 */

(function() {
    'use strict';

    angular
        .module('binary.pages.profit-table.controllers')
        .controller('ProfitTableController', ProfitTable);

    ProfitTable.$inject = ['$scope', '$filter', '$timeout', '$state', '$location', '$anchorScroll', 'languageService', 'tableStateService', 'accountService', 'websocketService', 'appStateService', 'currencyToSymbolService'];

    function ProfitTable($scope, $filter, $timeout, $state, $location, $anchorScroll, languageService, tableStateService, accountService, websocketService, appStateService, currencyToSymbolService) {
        var vm = this;
        vm.data = {};
        vm.noTransaction = false;
          vm.noMore = false;
          vm.hasRefresh = false;

          $scope.$on('authorize', () => {
            if(appStateService.profitTableRefresh){
              appStateService.profitTableRefresh = false;
              appStateService.isProfitTableSet = false;
              vm.pageState();
            }
          });

        $scope.$on('$stateChangeSuccess', function(ev, to, toParams, from, fromParams) {
            vm.lastPage = from.name;
        });

        vm.loadMore = function(){
          tableStateService.currentPage += 1 ;
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
        $scope.$on('scroll.infiniteScrollComplete', () => {
          vm.pageState();
        });

        vm.pageState = function() {
            if (!appStateService.isProfitTableSet) {
                appStateService.isProfitTableSet = true;
                tableStateService.dateType = 'allTime';
                vm.resetParams();
                vm.setParams();
            } else if (appStateService.isProfitTableSet && vm.lastPage == 'transactiondetail') {
                vm.transactions = [];
                vm.filteredTransactions = [];
                vm.lastPage = '';
                // vm.cameFromTransaction = true;
                // scroll to desired postition last clicked
                // show all prev contracts
                // maybe can use ionic refresher to load upper transactions on pulling page
                vm.setParams();
                if(vm.data.currentPage > 0){
                 vm.limit = vm.itemsPerPage * vm.data.currentPage + 1;
                 vm.data.currentPage = 0;
                }
            } else if (appStateService.isProfitTableSet && appStateService.isChangedAccount) {
                // if account is changed reset data attributes and send request again
                tableStateService.dateType = 'allTime';
                vm.resetParams();
                vm.setParams();
            } else if (appStateService.isProfitTableSet && vm.dateChanged == true) {
              vm.transactions = [];
              vm.filteredTransactions = [];
              vm.dateChanged = false;
              tableStateService.currentPage = 0;
              vm.setParams();
            }
            else{
              vm.setParams();
              $scope.$applyAsync(() => {
                  vm.noMore = false;
                });

            }
            vm.sendRequest();
        }

        vm.setParams = function() {
            vm.data.appID = tableStateService.appID;
            vm.data.dateType = tableStateService.dateType;
            vm.data.dateFrom = tableStateService.dateFrom;
            vm.data.dateTo = tableStateService.dateTo;
            vm.data.currentPage = tableStateService.currentPage;
            vm.itemsPerPage = 40;
            vm.limit = vm.itemsPerPage + 1;
        }
        vm.resetParams = function() {
            tableStateService.appID = 'allApps';
            tableStateService.dateFrom = '';
            tableStateService.dateTo = '';
            tableStateService.currentPage = 0;
            vm.transactions = [];
        }

        vm.sendRequest = function() {
            vm.params = {
                "description": 1,
                "limit": vm.limit,
                "offset": vm.itemsPerPage * vm.data.currentPage
            }
            if (vm.data.hasOwnProperty('dateFrom') && vm.data.dateFrom != "") {
                vm.params.date_from = vm.data.dateFrom;

            }
            if (vm.data.hasOwnProperty('dateTo') && vm.data.dateTo != "") {
                vm.params.date_to = vm.data.dateTo;
            }
            websocketService.sendRequestFor.profitTable(vm.params);
        }

        $scope.$on('profit_table:update', (e, _profitTable, _passthrough) => {
            vm.profitTable = _profitTable;
            vm.count = vm.profitTable.count;
            if (vm.count == 0) {
                vm.noTransaction = true;
                $scope.$applyAsync(() => {
                    vm.noMore = true;
                  });
                vm.setFiltered();
            } else if (vm.count > 0) {
                if (vm.count < vm.limit) {
                    // has no more to load on next call
                    vm.noTransaction = false;
                    $scope.$applyAsync(() => {
                        vm.noMore = true;
                      });
                    vm.profitTable.transactions.forEach(function(el, i) {
                            vm.transactions.push(vm.profitTable.transactions[i]);
                    });
                    vm.setFiltered();
                } else if (vm.count == vm.limit) {
                    // has at least one transaction on next call to show to user
                    vm.noTransaction = false;
                    $scope.$applyAsync(() => {
                        vm.noMore = false;
                      });
                    vm.profitTable.transactions.forEach(function(el, i) {
                        if (i < vm.count - 1) {
                            vm.transactions.push(vm.profitTable.transactions[i]);
                        }
                    });
                    vm.setFiltered();
                }
            }
        });

        vm.setFiltered = function(){
          $scope.$applyAsync(() => {
            vm.filteredTransactions = $filter('DataFilter')(vm.transactions, vm.data.appID);
                if (vm.filteredTransactions.length == 0) {
                    vm.noTransaction = true;
                } else {
                    vm.noTransaction = false;
                }
                // if(vm.cameFromTransaction){
                //   if (!_.isEmpty(sessionStorage.id)) {
                //       vm.scrto = sessionStorage.getItem('id');
                //     }
                //   vm.scrollTo(vm.scrto);
                //   vm.cameFromTransaction = false;
                // }
          })

        }

        vm.calcTime = function(daysNumber) {
            var now = new Date();
            vm.currentEpoch = now.getTime();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            var midnightEpoch = new Date(today).getTime();
            vm.diff = vm.currentEpoch - midnightEpoch;
            var dayBeforeDate = now.setDate(now.getDate() - daysNumber);
            tableStateService.dateFrom = Math.ceil((dayBeforeDate - vm.diff) / 1000);
        }

        vm.dateFilter = function() {
                if (vm.data.dateType == 'allTime') {
                  tableStateService.dateType = 'allTime';
                      tableStateService.dateTo = '';
                } else if (vm.data.dateType == 'monthAgo') {
                  tableStateService.dateType = 'monthAgo';
                    vm.calcTime(30);
                        tableStateService.dateTo = '';
                } else if (vm.data.dateType == 'sevenDayAgo') {
                  tableStateService.dateType = 'sevenDayAgo';
                    vm.calcTime(7);
                    tableStateService.dateTo = '';
                } else if (vm.data.dateType == 'threeDayAgo') {
                  tableStateService.dateType = 'threeDayAgo';
                    vm.calcTime(3);
                    tableStateService.dateTo = '';
                } else if (vm.data.dateType == 'oneDayAgo') {
                  tableStateService.dateType = 'oneDayAgo';
                    vm.calcTime(1);
                    tableStateService.dateTo = Math.ceil((vm.currentEpoch - vm.diff) / 1000);
                } else if (vm.data.dateType == 'today') {
                  tableStateService.dateType = 'today';
                    vm.calcTime(0);
                    tableStateService.dateTo = '';
                }
                tableStateService.dateType = vm.data.dateType;
                vm.dateChanged = true;
                vm.pageState();
        }


        vm.formatMoney = function(currency, amount) {
            vm.currency = sessionStorage.getItem('currency');
            return currencyToSymbolService.formatMoney(currency, amount);
        }


        // details functions
        vm.sendContractDetailRequest = function(id) {
            vm.id = id;
            sessionStorage.setItem('id', vm.id);
            $state.go('transactiondetail');
        }

        // vm.scrollTo = function(id) {
        //
        //         $location.hash(id);
        //         $anchorScroll();
        //
        // }
    }
})();
