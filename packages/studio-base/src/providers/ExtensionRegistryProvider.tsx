// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

import { PropsWithChildren } from "react";
import ReactDOM from "react-dom";
import { useAsync } from "react-use";

import Logger from "@foxglove/log";
import { ExtensionContext, ExtensionModule } from "@foxglove/studio";
import { useExtensionLoader } from "@foxglove/studio-base/context/ExtensionLoaderContext";
import ExtensionRegistryContext, {
  ExtensionRegistry,
  RegisteredPanel,
} from "@foxglove/studio-base/context/ExtensionRegistryContext";
import isDesktopApp from "@foxglove/studio-base/util/isDesktopApp";

const log = Logger.getLogger(__filename);

export default function ExtensionRegistryProvider(props: PropsWithChildren<unknown>): JSX.Element {
  const extensionLoader = useExtensionLoader();

  const { value: registry, error } = useAsync(async () => {
    const extensionList = await extensionLoader.getExtensions();
    log.debug(`Found ${extensionList.length} extension(s)`);

    // registered panels stored by their fully qualified id
    // the fully qualified id is the extension name + panel name
    const registeredPanels = new Map<string, RegisteredPanel>();

    for (const extension of extensionList) {
      log.debug(`Activating extension ${extension.name}`);

      const module = { exports: {} };
      const require = (name: string) => {
        return { react: React, "react-dom": ReactDOM }[name];
      };

      const extensionMode =
        process.env.NODE_ENV === "production"
          ? "production"
          : process.env.NODE_ENV === "test"
          ? "test"
          : "development";

      const ctx: ExtensionContext = {
        mode: extensionMode,

        registerPanel(params) {
          log.debug(`Extension ${extension.name} registering panel: ${params.name}`);

          const fullId = `${extension.name}.${params.name}`;
          if (registeredPanels.has(fullId)) {
            log.warn(`Panel ${fullId} is already registered`);
            return;
          }

          registeredPanels.set(fullId, {
            extensionName: extension.name,
            registration: params,
          });
        },
      };

      try {
        let pathPrefix: string;
        if (isDesktopApp()) {
          pathPrefix = `x-foxglove-extension-rsrc://${extension.id}`;
        } else {
          throw new Error("Extensions are not supported in the browser");
        }

        const unwrappedExtensionSource = (
          await extensionLoader.loadExtension(extension.id)
        ).replace("@FOXGLOVE_EXTENSION_PATH_PREFIX@", pathPrefix);

        // eslint-disable-next-line no-new-func
        const fn = new Function("module", "require", unwrappedExtensionSource);

        // load the extension module exports
        fn(module, require, {});
        const wrappedExtensionModule = module.exports as ExtensionModule;

        wrappedExtensionModule.activate(ctx);
      } catch (err) {
        log.error(err);
      }
    }

    const reg: ExtensionRegistry = {
      getRegisteredPanel: (fullId: string) => registeredPanels.get(fullId),
      getRegisteredPanels: () => Array.from(registeredPanels.values()),
    };
    return reg;
  }, [extensionLoader]);

  if (error) {
    throw error;
  }

  if (!registry) {
    return <></>;
  }

  return (
    <ExtensionRegistryContext.Provider value={registry}>
      {props.children}
    </ExtensionRegistryContext.Provider>
  );
}
