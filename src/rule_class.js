/* eslint-disable no-use-before-define */
// eslint-disable-next-line import/no-unresolved
import kbn from 'app/core/utils/kbn';
// eslint-disable-next-line import/no-extraneous-dependencies
import moment from 'moment';

export default class Rule {
  /** @ngInject */
  constructor(pattern, data) {
    this.data = data;
    this.data.pattern = pattern;
    this.shapeMaps = [];
    this.textMaps = [];
    this.linkMaps = [];
    this.valueMaps = [];
    this.rangeMaps = [];
    this.import(data);
  }

  getData() {
    return this.data;
  }

  export() {
    return JSON.stringify(this);
  }

  import(obj) {
    this.data.unit = obj.unit || 'short';
    this.data.type = obj.type || 'number';
    this.data.alias = obj.alias || 'No name';
    this.data.aggregation = obj.aggregation || 'current';
    this.data.decimals = obj.decimals || 2;
    this.data.colors = obj.colors || [
      'rgba(245, 54, 54, 0.9)',
      'rgba(237, 129, 40, 0.89)',
      'rgba(50, 172, 45, 0.97)',
    ];
    this.data.style = obj.style || obj.colorMode || 'fillColor';
    this.data.colorOn = obj.colorOn || 'a';
    this.data.link = (obj.link !== undefined ? obj.link : false);
    this.data.linkOn = obj.colorOn || 'a';
    this.data.linkUrl = obj.linkUrl || '';
    this.data.textOn = obj.textOn || 'wmd';
    this.data.textReplace = obj.textReplace || 'content';
    this.data.textPattern = obj.textPattern || '/.*/';
    this.data.pattern = obj.pattern || this.data.pattern;
    this.data.dateFormat = obj.dateFormat || 'YYYY-MM-DD HH:mm:ss';
    this.data.thresholds = obj.thresholds || [];
    this.data.invert = (obj.invert !== undefined ? obj.invert : false);
    this.data.overlayIcon = (obj.overlayIcon !== undefined ? obj.overlayIcon : false);
    let maps = [];

    // SHAPES
    this.data.shapeProp = obj.shapeProp || 'id';
    this.data.shapeData = [];
    // For 0.2.0
    maps = [];
    if (obj.shapeMaps !== undefined && obj.shapeMaps !== null && obj.shapeMaps.length > 0) maps = obj.shapeMaps;
    else maps = obj.shapeData;

    if (maps !== undefined && maps !== null && maps.length > 0) {
      maps.forEach((map) => {
        const newData = {};
        const sm = new ShapeMap(map.pattern, newData);
        sm.import(map);
        this.shapeMaps.push(sm);
        this.data.shapeData.push(newData);
      });
    }

    // TEXT
    this.data.textProp = obj.textProp || 'id';
    this.data.textData = [];
    // For 0.2.0
    maps = [];
    if (obj.shapeMaps !== undefined && obj.shapeMaps !== null && obj.shapeMaps.length > 0) maps = obj.textMaps;
    else maps = obj.textData;
    if (maps !== undefined && maps != null && maps.length > 0) {
      maps.forEach((map) => {
        const newData = {};
        const tm = new TextMap(map.pattern, newData);
        tm.import(map);
        this.textMaps.push(tm);
        this.data.textData.push(newData);
      });
    }

    // LINK
    this.data.linkProp = obj.linkProp || 'id';
    this.data.linkData = [];
    if (obj.linkData !== undefined && obj.linkData != null && obj.linkData.length > 0) {
      obj.linkData.forEach((map) => {
        const newData = {};
        const lm = new LinkMap(map.pattern, newData);
        lm.import(map);
        this.linkMaps.push(lm);
        this.data.linkData.push(newData);
      });
    }

    this.data.mappingType = obj.mappingType || 1;

    // VALUES
    this.data.valueData = [];
    if (obj.valueData !== undefined && obj.valueData != null && obj.valueData.length > 0) {
      obj.valueData.forEach((map) => {
        const newData = {};
        const vm = new ValueMap(map.value, map.text, newData);
        vm.import(map);
        this.valueMaps.push(vm);
        this.data.valueData.push(newData);
      });
    }

    // RANGE
    this.data.rangeData = [];
    if (obj.rangeData !== undefined && obj.rangeData != null && obj.rangeData.length > 0) {
      obj.rangeData.forEach((map) => {
        const newData = {};
        const rm = new RangeMap(map.from, map.to, map.text, newData);
        this.rangeMaps.push(rm);
        this.data.rangeData.push(newData);
      });
    }

    this.data.sanitize = obj.sanitize || false;
  }

  invertColorOrder() {
    const ref = this.data.colors;
    const copy = ref[0];
    ref[0] = ref[2];
    ref[2] = copy;
    if (this.data.invert) this.data.invert = false;
    else this.data.invert = true;
  }

  //
  // Conditions
  //
  toColorize(value) {
    if (this.data.colorOn === 'a') return true;
    if (this.data.colorOn === 'wc' && this.getThresholdLevel(value) >= 1) return true;
    return false;
  }

  toValorize(value) {
    if (this.data.textOn === 'wmd' && value !== undefined) return true;
    if (this.data.textOn === 'wmd' && value === undefined) return false;
    if (this.data.textOn === 'n') return false;
    if (this.data.textOn === 'wc' && this.getThresholdLevel(value) >= 1) return true;
    if (this.data.textOn === 'co' && this.getThresholdLevel(value) >= 2) return true;
    return false;
  }

  toIconize(value) {
    if (this.data.overlayIcon === false) return false;
    if (this.data.overlayIcon === true && this.getThresholdLevel(value) >= 1) return true;
    return false;
  }

  toLinkable(value) {
    if (this.data.link === false) return false;
    if (this.data.linkOn === 'a') return true;
    if (this.data.linkOn === 'wc' && this.getThresholdLevel(value) >= 1) return true;
    return false;
  }


  //
  // Series
  //
  matchSerie(serie) {
    if (this.data.pattern === null || this.data.pattern === undefined) return false;
    return u.matchString(serie.alias, this.data.pattern);
  }

  //
  // SHAPE MAPS
  //
  addShapeMap(pattern) {
    const data = {};
    const m = new ShapeMap(pattern, data);
    m.import(data);
    this.shapeMaps.push(m);
    this.data.shapeData.push(data);
  }

  removeShapeMap(index) {
    this.data.shapeData.splice(index, 1);
    this.shapeMaps.splice(index, 1);
  }

  getShapeMap(index) {
    return this.shapeMaps[index];
  }

  getShapeMaps() {
    return this.shapeMaps;
  }

  matchShape(pattern) {
    let found = false;
    this.shapeMaps.forEach((element) => {
      if (element.match(pattern)) found = true;
    });
    return found;
  }

  //
  // TEXT MAPS
  //
  addTextMap(pattern) {
    const data = {};
    const m = new TextMap(pattern, data);
    m.import(data);
    this.textMaps.push(m);
    this.data.textData.push(data);
  }

  removeTextMap(index) {
    this.data.textData.splice(index, 1);
    this.textMaps.splice(index, 1);
  }

  getTextMap(index) {
    return this.textMaps[index];
  }

  getTextMaps() {
    return this.textMaps;
  }

  matchText(pattern) {
    let found = false;
    this.textMaps.forEach((element) => {
      if (element.match(pattern)) found = true;
    });
    return found;
  }

  //
  // LINK MAPS
  //
  addLinkMap(pattern) {
    u.log(1, "Rule.addLinkMap()");
    const data = {};
    const m = new LinkMap(pattern, data);
    m.import(data);
    this.linkMaps.push(m);
    this.data.linkData.push(data);
  }

  removeLinkMap(index) {
    this.data.linkData.splice(index, 1);
    this.linkMaps.splice(index, 1);
  }

  getLinkMap(index) {
    return this.linkMaps[index];
  }

  getLinkMaps() {
    return this.linkMaps;
  }

  matchLink(pattern) {
    let found = false;
    this.linkMaps.forEach((element) => {
      if (element.match(pattern)) found = true;
    });
    return found;
  }

  //
  // STRING VALUE MAPS
  //
  addValueMap(value, text) {
    const data = {};
    const m = new ValueMap(value, text, data);
    m.import(data);
    this.valueMaps.push(m);
    this.data.valueData.push(data);
  }

  removeValueMap(index) {
    this.data.valueData.splice(index, 1);
    this.valueMaps.splice(index, 1);
  }

  getValueMap(index) {
    return this.valueMaps[index];
  }

  getValueMaps() {
    return this.valueMaps;
  }

  //
  // STRING RANGE VALUE MAPS
  //
  addRangeMap(from, to, text) {
    const data = {};
    const m = new RangeMap(from, to, text, data);
    this.rangeMaps.push(m);
    this.data.rangeData.push(data);
  }

  removeRangeMap(index) {
    this.data.rangeData.splice(index, 1);
    this.rangeMaps.splice(index, 1);
  }

  getRangeMap(index) {
    return this.rangeMaps[index];
  }

  getRangeMaps() {
    return this.rangeMaps;
  }

  hideRangeMap(index) {
    this.rangeMaps[index].hide();
  }

  showRangeMap(index) {
    this.rangeMaps[index].show();
  }

  //
  // Format value
  //
  getColorForValue(value) {
    if (!this.data.thresholds || this.data.thresholds.length === 0) {
      return null;
    }

    for (let i = this.data.thresholds.length; i > 0; i -= 1) {
      if (value >= this.data.thresholds[i - 1]) {
        return this.data.colors[i];
      }
    }
    return _.first(this.data.colors);
  }

  getThresholdLevel(value) {
    let thresholdLevel = 0;
    const thresholds = this.data.thresholds;

    if (thresholds === undefined || thresholds.length === 0) return -1;
    if (thresholds.length !== 2) return -1;

    // non invert
    if (!this.data.invert) {
      thresholdLevel = 2;
      if (value >= thresholds[0]) thresholdLevel = 1;
      if (value >= thresholds[1]) thresholdLevel = 0;
    } else {
      thresholdLevel = 0;
      if (value >= thresholds[0]) thresholdLevel = 1;
      if (value >= thresholds[1]) thresholdLevel = 2;
    }
    return thresholdLevel;
  }

  getValueForSerie(serie) {
    if (this.matchSerie(serie)) {
      let value = _.get(serie.stats, this.data.aggregation);
      if (value === undefined || value === null) {
        value = serie.datapoints[serie.datapoints.length - 1][0];
      }
      return value;
    }
    return '-';
  }

  getFormattedValueForSerie(serie) {
    const formattedValue = this.getValueForSerie(serie);
    return this.getFormattedValue(formattedValue);
  }

  getLink() {
    return this.data.linkUrl;
  }

  getFormattedValue(value) {
    // Number
    if (this.data.type === 'number') {
      if (!_.isFinite(value)) return 'Invalid Number';
      if (value === null || value === void 0) {
        return '-';
      }
      let decimals = this.decimalPlaces(value);
      decimals =
        typeof this.data.decimals === 'number' ? Math.min(this.data.decimals, decimals) : decimals;
      return formatValue(value, this.data.unit, this.data.decimals);
    }

    if (this.data.type === 'string') {
      if (_.isArray(value)) {
        value = value.join(', ');
      }
      const mappingType = this.data.mappingType || 0;
      if (mappingType === 1 && this.valueMaps) {
        for (let i = 0; i < this.valueMaps.length; i += 1) {
          const map = this.valueMaps[i];
          if (map.match(value)) return map.getFormattedText(value);
        }
        return value.toString();
      }

      if (mappingType === 2 && this.rangeMaps) {
        for (let i = 0; i < this.rangeMaps.length; i += 1) {
          const map = this.rangeMaps[i];
          if (map.match(value)) return map.getFormattedText(value);
        }
        return value.toString();
      }

      if (value === null || value === void 0) {
        return '-';
      }
    }

    if (this.data.type === 'date') {
      if (value === undefined || value === null) {
        return '-';
      }

      if (_.isArray(value)) {
        value = value[0];
      }
      const date = moment(value);
      // if (this.dashboard.isTimezoneUtc()) {
      //     date = date.utc();
      // }
      return date.format(this.data.dateFormat);
    }

    return value;
  }

  getReplaceText(text, FormattedValue) {
    if (this.data.textReplace === 'content') return FormattedValue;
    const regexVal = u.stringToJsRegex(this.data.textPattern);
    if (text.toString().match(regexVal)) return text.toString().replace(regexVal, FormattedValue);
    return text;
  }

  defaultValueFormatter(value) {
    if (value === null || value === void 0 || value === undefined) {
      return '';
    }

    if (_.isArray(value)) {
      value = value.join(', ');
    }

    if (this.sanitize) {
      return this.$sanitize(value);
    }
    return _.escape(value);
  }

  decimalPlaces(num) {
    let match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
    if (!match) {
      return 0;
    }
    return Math.max(
      0,
      // Number of digits right of decimal point.
      (match[1] ? match[1].length : 0) -
        // Adjust for scientific notation.
        (match[2] ? +match[2] : 0)
    );
  }

}

//
// ShapeMap Class
//
class ShapeMap {
  constructor(pattern, data) {
    this.data = data;
    this.id = u.uniqueID();
    this.data.pattern = undefined;
    this.data.pattern = pattern;
    this.import(data);
  }

  import(obj) {
    this.data.pattern = obj.pattern || '';
    this.data.hidden = obj.hidden || false;
  }

  match(text) {
    if (text === undefined || text === null || text.length === 0) return false;
    return u.matchString(text, this.data.pattern);
  }

  getId() {
    return this.id;
  }

  show() {
    this.data.hidden = false;
  }

  hide() {
    this.data.hidden = true;
  }

  isHidden() {
    return this.data.hidden;
  }

  export() {
    return {
      pattern: this.data.pattern,
      hidden: this.data.hidden,
    };
  }

  toColorize(value) {
    if (this.data.hidden) return false;
    return this.rule.toColorize(value);
  }

  toVisible() {
    if (this.data.hidden) return false;
    return true;
  }
}

//
// TextMap Class
//
class TextMap {
  constructor(pattern, data) {
    this.data = data;
    this.id = u.uniqueID();
    this.data.pattern = pattern;
    this.import(data);
  }

  import(obj) {
    this.data.pattern = obj.pattern || this.data.pattern;
    this.data.hidden = obj.hidden || false;
  }

  match(text) {
    if (text === undefined || text === null || text.length === 0) return false;
    return u.matchString(text, this.data.pattern);
  }

  getId() {
    return this.id;
  }

  show() {
    this.data.hidden = false;
  }

  hide() {
    this.data.hidden = true;
  }

  isHidden() {
    return this.data.hidden;
  }

  export() {
    return {
      pattern: this.data.pattern,
      hidden: this.data.hidden,
    };
  }
}

//
// LinkMap Class
//
class LinkMap {
  constructor(pattern, data) {
    this.data = data;
    this.id = u.uniqueID();
    this.data.pattern = pattern;
    this.import(data);
  }

  import(obj) {
    this.data.pattern = obj.pattern || this.data.pattern || '';
    this.data.hidden = obj.hidden || false;
  }

  match(text) {
    if (text === undefined || text === null || text.length === 0) return false;
    return u.matchString(text, this.data.pattern);
  }

  getId() {
    return this.id;
  }

  show() {
    this.data.hidden = false;
  }

  hide() {
    this.data.hidden = true;
  }

  isHidden() {
    return this.data.hidden;
  }

  export() {
    return {
      pattern: this.data.pattern,
      hidden: this.data.hidden,
    };
  }
}

//
// RangeMap Class
//
class RangeMap {
  constructor(from, to, text, data) {
    this.data = data;
    this.id = u.uniqueID();
    this.data.from = from;
    this.data.to = to;
    this.data.text = text;
    this.data.hidden = false;
    this.import(data);
  }

  import(obj) {
    this.data.from = obj.from || this.data.from || '';
    this.data.to = obj.to || this.data.to || '';
    this.data.text = obj.text || this.data.text || '';
    this.data.hidden = obj.hidden || this.data.hidden || false;
  }

  match(value) {
    if (this.data.from === 'null' && this.data.to === 'null') {
      return true;
    }
    if (value === null) {
      if (this.data.from === 'null' && this.data.to === 'null') {
        return true;
      }
    }
    if (Number(this.data.from) <= Number(value) && Number(this.data.to) >= Number(value)) {
      return true;
    }
    return false;
  }

  getId() {
    return this.id;
  }

  getFormattedText(value) {
    if (value === null) {
      if (this.data.from === 'null' && this.data.to === 'null') {
        return this.data.text;
      }
    }
    if (this.match(value)) {
      return this.data.text;
    }
    return value;
  }

  show() {
    this.data.hidden = false;
  }

  hide() {
    this.data.hidden = true;
  }

  isHidden() {
    return this.data.hidden;
  }

  export() {
    return {
      from: this.data.from,
      to: this.data.to,
      text: this.data.text,
      hidden: this.data.hidden,
    };
  }
}

//
// ValueMap Class
//
class ValueMap {
  constructor(value, text, data) {
    this.data = data;
    this.id = u.uniqueID();
    this.data.value = value;
    this.data.text = text;
    this.data.hidden = false;
    this.import(data);
  }

  import(obj) {
    this.data.value = obj.value || this.data.value || '';
    this.data.text = obj.text || this.data.text || '';
    this.data.hidden = obj.hidden || this.data.hidden || false;
  }

  match(value) {
    if (value === null || value === undefined) {
      if (this.data.value === 'null') {
        return true;
      }
      return false;
    }

    if (!_.isString(value) && Number(this.data.value) === Number(value)) {
      return true;
    }

    return u.matchString(value.toString(), this.data.value);
  }

  getId() {
    return this.id;
  }

  getFormattedText(value) {
    if (value === null) {
      if (this.data.value === 'null') {
        return this.data.text;
      }
    }
    if (this.match(value)) {
      return this.data.text;
    }
    return value;
  }

  show() {
    this.data.hidden = false;
  }

  hide() {
    this.data.hidden = true;
  }

  isHidden() {
    return this.data.hidden;
  }

  export() {
    return {
      value: this.data.value,
      text: this.data.text,
      hidden: this.data.hidden,
    };
  }
}

function formatValue(value, unit, decimals) {
  return kbn.valueFormats[unit](value, decimals, null).toString();
}