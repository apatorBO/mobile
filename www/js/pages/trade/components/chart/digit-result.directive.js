/**
 * @name digit-result directive
 * @author Morteza Tavanarad
 * @contributors []
 * @since 10/01/2016
 * @copyright Binary Ltd
 */

(function(){
  'use strict';

  angular
    .module('binary.pages.trade.components.chart.directives')
    .directive('bgDigitResult', Result);

  function Result(){
    var directive = {
      restrict: 'E',
      templateUrl: 'js/pages/trade/components/chart/digit-result.template.html',
      controller: 'DigitResultController',
      controllerAs: 'vm',
      bindToController: true,
      scope: {}
    };

    return directive;
  }
})();
