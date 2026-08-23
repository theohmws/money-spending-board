import { act, fireEvent, render, screen } from '@testing-library/react';

import {
  canRegisterServiceWorker,
  ServiceWorkerRegistration,
} from './ServiceWorkerRegistration';

describe('canRegisterServiceWorker', () => {
  afterEach(() => {
    // @ts-expect-error -- test-only cleanup of a jsdom-defined property
    delete navigator.serviceWorker;
  });

  it('is false outside production', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');

    expect(canRegisterServiceWorker()).toBe(false);
  });

  it('is true in production when the browser supports service workers', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'production');
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {},
      configurable: true,
    });

    expect(canRegisterServiceWorker()).toBe(true);
  });
});

describe('ServiceWorkerRegistration', () => {
  const register = jest.fn().mockResolvedValue(undefined);
  let controllerChangeListeners: (() => void)[];
  let mockServiceWorker: any;

  beforeEach(() => {
    controllerChangeListeners = [];
    mockServiceWorker = {
      register,
      controller: null,
      addEventListener: jest.fn((type: string, cb: () => void) => {
        if (type === 'controllerchange') controllerChangeListeners.push(cb);
      }),
      removeEventListener: jest.fn(),
    };
    Object.defineProperty(navigator, 'serviceWorker', {
      value: mockServiceWorker,
      configurable: true,
    });
  });

  afterEach(() => {
    // Not deleting navigator.serviceWorker here: testing-library's implicit
    // unmount-on-cleanup (which runs after this hook) calls this
    // component's effect cleanup, which reads navigator.serviceWorker —
    // deleting it first would make that crash. beforeEach redefines it
    // fresh before every test regardless.
    register.mockClear();
  });

  const fireControllerChange = () => {
    act(() => {
      controllerChangeListeners.forEach((cb) => cb());
    });
  };

  it('renders nothing', () => {
    const { container } = render(<ServiceWorkerRegistration />);

    expect(container).toBeEmptyDOMElement();
  });

  it('registers /sw.js in production', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'production');

    render(<ServiceWorkerRegistration />);

    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('does not register outside production', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'development');

    render(<ServiceWorkerRegistration />);

    expect(register).not.toHaveBeenCalled();
  });

  it('does not show the update banner on the tab’s first controllerchange (initial control, not an update)', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'production');

    render(<ServiceWorkerRegistration />);
    fireControllerChange();

    expect(screen.queryByText(/new version/i)).not.toBeInTheDocument();
  });

  it('shows an update banner on a later controllerchange during the same page load', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'production');

    render(<ServiceWorkerRegistration />);
    fireControllerChange(); // initial control — ignored
    fireControllerChange(); // a real swap

    expect(screen.getByText(/new version/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
  });

  it('treats even the first controllerchange as a real update if the tab was already controlled on mount', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'production');
    mockServiceWorker.controller = {};

    render(<ServiceWorkerRegistration />);
    fireControllerChange();

    expect(screen.getByText(/new version/i)).toBeInTheDocument();
  });

  it('reloads the page when the reload button is clicked', () => {
    jest.replaceProperty(process.env, 'NODE_ENV', 'production');
    const reloadSpy = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadSpy },
      configurable: true,
    });

    render(<ServiceWorkerRegistration />);
    fireControllerChange();
    fireControllerChange();
    fireEvent.click(screen.getByRole('button', { name: /reload/i }));

    expect(reloadSpy).toHaveBeenCalled();
  });
});
