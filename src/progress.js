export function Progress(el) {
    this.el = el;
    this.loading = 0;
    this.loaded = 0;
}
Progress.prototype.addLoading = function () {
    ++this.loading;
    this.update();
};
Progress.prototype.addLoaded = function () {
    ++this.loaded;
    this.update();
};
Progress.prototype.update = function () {
    const width = ((this.loaded / this.loading) * 100).toFixed(1) + '%';
    this.el.style.width = width;
};
Progress.prototype.show = function () {
    this.el.style.visibility = 'visible';
};
Progress.prototype.hide = function () {
    const style = this.el.style;
    setTimeout(function () {
        style.visibility = 'hidden';
        style.width = 0;
    }, 250);
};

