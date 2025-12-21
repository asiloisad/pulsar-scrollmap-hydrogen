const { Disposable } = require("atom");

module.exports = {

  activate() {
    this.editors = new Map();
    this.hydrogenService = null;
  },

  deactivate() {
    this.editors.clear();
    this.hydrogenService = null;
  },

  consumeHydrogenService(hydrogenService) {
    this.hydrogenService = hydrogenService;

    const updateAll = () => {
      for (const ctx of this.editors.values()) {
        ctx.update();
      }
    };

    let subscription = hydrogenService.onDidUpdate?.(updateAll);

    return new Disposable(() => {
      this.hydrogenService = null;
      subscription?.dispose();
    });
  },

  provideScrollmap() {
    const self = this;
    return {
      name: "hydrogen",
      subscribe: (editor, update) => {
        self.editors.set(editor, { update });
        return new Disposable(() => self.editors.delete(editor));
      },
      recalculate: (editor) => {
        if (!self.hydrogenService) {
          return [];
        }
        const breakpoints = self.hydrogenService.getBreakpoints?.(editor) || [];
        return breakpoints.map((breakpoint) => ({
          row: editor.screenPositionForBufferPosition(breakpoint).row,
        }));
      },
    };
  },
};
