import Rule from "./rule_class";
// var u  = require("./utils");

export default class RulesHandler {
    /** @ngInject */
    constructor($scope, elem, attrs, ctrl) {
        this.$scope = $scope;
        $scope.editor = this;
        this.panelCtrl = $scope.ctrl;
        this.panel = this.panelCtrl.panel;
        this.rules = [];
        if (this.panelCtrl.version != this.panel.version) this.migrate(this.rules)
        else this.import(this.rules);
    }

    backup() {
        this.panel.rules = this.export();
    }

    export() {
        let rules = [];
        this.getRules().forEach(rule => {
            rules.push(rule.export());
        });
        return rules;
    }

    import(obj) {
        obj.forEach(rule => {
            let newRule = new Rule('');
            newRule.import(rule);
            this.rules.push(newRule);
        });
    }

    migrate(obj) {
        obj.forEach(rule => {
            let newRule = new Rule('');
            newRule.migrate(rule);
            this.rules.push(newRule);
        });
    }

    getRules() {
        return this.rules;
    }

    getRule(index) {
        return this.rules[index];
    }

    addRule() {
        const newRule = new Rule("/.*/")
        rules.push(newRule);
    }

    removeRule(rule) {
        this.rules = _.without(this.rules, rule);
    }

    cloneRule(rule) {
        let newRule = angular.copy(rule);
        newRule.id = u.uniqueID();
        const rules = this.rules;
        const rulesCount = rules.length;
        let indexToInsert = rulesCount;
        // check if last is a catch all rule, then add it before that one
        if (rulesCount > 0) {
            const last = rules[rulesCount - 1];
            if (last.pattern === "/.*/") {
                indexToInsert = rulesCount - 1;
            }
        }
        rules.splice(indexToInsert, 0, newRule);
        this.activeRuleIndex = indexToInsert;
    }

    moveRuleToUp(index) {
        const first = 0;
        const rules = this.rules
        const last = rules.length - 1;
        if (index != first && last != first) {
            let curr = rules[index];
            let before = rules[index - 1];
            rules[index - 1] = curr;
            rules[index] = before;
        }
    }

    moveRuleToDown(index) {
        const first = 0;
        const rules = this.rules
        const last = rules.length - 1;
        if (index != last && last != first) {
            let curr = rules[index];
            let after = rules[index + 1];
            rules[index + 1] = curr;
            rules[index] = after;
        }
    }
}