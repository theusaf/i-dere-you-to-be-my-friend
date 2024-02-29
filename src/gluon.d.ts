import * as Gluon from "@gluon-framework/gluon";

declare global {
  interface GluonVersions {
    browser: string;
    browserType: string;
    builder: string;
    embedded: {
      node: boolean;
      browser: boolean;
    };
    gluon: string;
    js: {
      node: string;
      browser: string;
    };
    node: string;
    product: string;
  }

  interface GluonIPC {
    [key: string]: any;
    send: Gluon.IPCApi["send"];
    on: Gluon.IPCApi["on"];
    removeListener: Gluon.IPCApi["removeListener"];
    store: Gluon.IPCApi["store"];
  }

  interface Window {
    Gluon: {
      ipc: GluonIPC;
      versions: GluonVersions;
    };
  }

  declare const Gluon: {
    ipc: GluonIPC;
    versions: GluonVersions;
  };
}
