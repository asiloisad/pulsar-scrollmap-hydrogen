const { CompositeDisposable, Disposable } = require("atom");

module.exports = {

  activate() {
    this.disposables = new CompositeDisposable(
      atom.config.observe("scrollmap-hydrogen.threshold", (value) => {
        this.threshold = value;
      }),
    );
    this.hydrogenService = null;
  },

  deactivate() {
    this.hydrogenService = null;
    this.disposables.dispose();
  },

  breakpoints(editor) {
    if (!this.hydrogenService) {
      return [];
    }
    return this.hydrogenService.initBreakpoints?.(editor) || [];
  },

  consumeHydrogenService(hydrogenService) {
    this.hydrogenService = hydrogenService;
    // Update existing editors
    for (const editor of atom.workspace.getTextEditors()) {
      const layer = editor?.scrollmap?.layers.get('hydrogen');
      if (!layer) continue;
      layer.cache.set('data', this.breakpoints(editor));
      layer.update();
    }
    let subscription = hydrogenService.onDidUpdate?.(({ editor, breakpoints }) => {
      const layer = editor?.scrollmap?.layers.get('hydrogen');
      if (!layer) return;
      layer.cache.set('data', breakpoints);
      layer.update();
    });
    return new Disposable(() => {
      this.hydrogenService = null;
      subscription?.dispose();
    });
  },

  provideScrollmap() {
    return {
      name: "hydrogen",
      description: "Hydrogen breakpoint markers",
      initialize: ({ cache, editor, disposables, update }) => {
        cache.set('data', this.breakpoints(editor));
        disposables.add(
          atom.config.onDidChange("scrollmap-hydrogen.threshold", update),
        );
      },
      getItems: ({ editor, cache }) => {
        const items = (cache.get('data') || []).map((breakpoint) => ({
          row: editor.screenPositionForBufferPosition(breakpoint).row,
        }));
        if (this.threshold && items.length > this.threshold) {
          return [];
        }
        return items;
      },
    };
  },
};
