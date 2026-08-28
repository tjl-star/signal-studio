// Small compatibility layer for older Chromium/Edge runtimes used on some
// company-managed computers. It is intentionally dependency-free and runs
// before ECharts and the dashboard application.
(function () {
  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, 'at', {
      configurable: true,
      value: function (index) {
        var i = Number(index) || 0;
        if (i < 0) i = this.length + i;
        return i < 0 || i >= this.length ? undefined : this[i];
      }
    });
  }
  if (!Object.fromEntries) {
    Object.fromEntries = function (entries) {
      var result = {};
      for (var i = 0; i < entries.length; i += 1) result[entries[i][0]] = entries[i][1];
      return result;
    };
  }
})();
