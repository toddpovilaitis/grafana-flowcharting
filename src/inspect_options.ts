import FlowChartingPlugin from './plugin';
import FlowchartHandler from './flowchartHandler';
import State from 'state_class';

declare var GFP: FlowChartingPlugin;
interface TInspectOptionsScope extends ng.IScope {
  flowchartHandler: any;
  editor: InspectOptionsCtrl;
  GFP: FlowChartingPlugin;
  ctrl: any; //TODO: define type
}

interface TSelectBoolean {
  text: string;
  value: boolean;
}

interface TSelectNumber {
  text: string;
  value: number;
}

export class InspectOptionsCtrl {
  enable = false; // enable inspector or not
  $scope: TInspectOptionsScope;
  ctrl: any; //TODO: define type
  panel: any; //TODO: define type
  logDisplayOption: TSelectBoolean[] = [
    { text: 'True', value: true },
    { text: 'False', value: false },
  ];
  logLevelOption: TSelectNumber[] = [
    { text: 'DEBUG', value: 0 },
    { text: 'INFO', value: 1 },
    { text: 'WARNING', value: 2 },
    { text: 'ERROR', value: 3 },
  ];
  logLevel: number;
  logDisplay: boolean;
  flowchartHandler: FlowchartHandler;
  panelCtrl: any;
  colors: any; //TODO: define style
  /** @ngInject */
  constructor($scope: TInspectOptionsScope) {
    $scope.editor = this;
    $scope.GFP = GFP;
    this.$scope = $scope;
    this.ctrl = $scope.ctrl;
    this.panel = this.ctrl.panel;
    this.logLevel = GFP.log.logLevel;
    this.logDisplay = GFP.log.logDisplay;
    this.flowchartHandler = this.ctrl.flowchartHandler;
    $scope.flowchartHandler = this.ctrl.flowchartHandler;
  }

  render() {
    this.panelCtrl.render();
  }

  onColorChange(styleIndex, colorIndex) {
    return newColor => {
      this.colors[colorIndex] = newColor;
    };
  }

  onDebug() {
    GFP.log.logLevel = this.logLevel;
    GFP.log.logDisplay = this.logDisplay;
  }

  onChangeId(state: State) {
    if (state.newcellId !== undefined && state.cellId !== state.newcellId) {
      this.flowchartHandler.getFlowchart().getStateHandler().edited = true;
      if (state.previousId === undefined) {
        state.previousId = state.cellId;
      }
      state.cellId = state.newcellId;
      state.edited = true;
    }
    state.edit = false;
  }

  onEdit(state: State) {
    state.edit = true;
    state.newcellId = state.cellId;
    const elt = document.getElementById(state.cellId);
    setTimeout(() => {
      if (elt) {
        elt.focus();
      }
    }, 100);
  }

  reset() {
    this.flowchartHandler.draw();
    this.flowchartHandler.refresh();
    // this.$scope.$apply();
  }

  apply() {
    const flowchart = this.flowchartHandler.getFlowchart();
    const states = flowchart.getStateHandler().getStates();
    states.forEach(state => {
      if (state.edited) {
        flowchart.renameId(state.previousId, state.cellId);
      }
    });
    flowchart.applyModel();
  }

  selectCell(state) {
    state.highlightCell();
  }

  unselectCell(state) {
    state.unhighlightCell();
  }
}

/** @ngInject */
export function inspectOptionsTab($q, uiSegmentSrv) {
  'use strict';
  return {
    restrict: 'E',
    scope: true,
    templateUrl: `${GFP.getPartialPath()}/inspect_options.html`,
    controller: InspectOptionsCtrl,
  };
}
