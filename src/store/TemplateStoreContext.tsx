import { createContext, useContext, type ReactNode } from 'react';
import { useTemplateStoreState, type TemplateStoreApi } from './useTemplateStore';

const TemplateStoreContext = createContext<TemplateStoreApi | null>(null);

export function TemplateStoreProvider({ children }: { children: ReactNode }) {
  const templateStore = useTemplateStoreState();
  return (
    <TemplateStoreContext.Provider value={templateStore}>
      {children}
    </TemplateStoreContext.Provider>
  );
}

export function useTemplateStore(): TemplateStoreApi {
  const templateStore = useContext(TemplateStoreContext);
  if (!templateStore) {
    throw new Error('useTemplateStore must be used inside TemplateStoreProvider');
  }
  return templateStore;
}
