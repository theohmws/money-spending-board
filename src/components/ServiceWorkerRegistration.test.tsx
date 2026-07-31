import { render } from '@testing-library/react';

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

  beforeEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });
  });

  afterEach(() => {
    register.mockClear();
    // @ts-expect-error -- test-only cleanup of a jsdom-defined property
    delete navigator.serviceWorker;
  });

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
});
