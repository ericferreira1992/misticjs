import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js';
import { Route } from './route/route';
import { StartConfig } from './start-config';
import { Router } from './route/router';
import { NimblePage } from './elements/nimble-page.element';
import { NimbleRouter } from './elements/nimble-router.element';
import { NimbleDialog } from './elements/nimble-dialog.element';
import { NimbleDialogArea } from './elements/nimble-dialog-area.element';
import { RouterEvent } from './route/router-event.enum';
import { Directive } from './directives/abstracts/directive';
import { INTERNAL_DIRECTIVES } from './directives/internal-directives';
import { Type } from './inject/type.interface';
import { Container } from './inject/container';
import { Provider, Token } from './inject/provider';
import { IterationDirective } from './directives/abstracts/iteration-directive';
import { INTERNAL_PROVIDERS } from './providers/internal-providers';
import { Listener } from './render/listener';
import { RouteRender } from './route/route-render';

export class NimbleApp {
    public static instance: NimbleApp;

    private containerInjector: Container = new Container();

    private afterRenderFn: () => void = null;

	public state: NimbleAppState = NimbleAppState.INITIALIZING;
	
	private firstRender: boolean = true;
	private changedRoute: boolean = false;

	private _rootElement: HTMLElement = null;
    public get rootElement() { return this._rootElement; }
	
    private _baseHref: string = '/';
    public get baseHref() { return this._baseHref; }
    public get hasBaseHref() { return this.baseHref !== '' && this.baseHref !== '/'; }

    public iterationElementsApplied: { virtual: { element: HTMLElement, directives: Type<Directive>[], anyChildrenApplied: boolean }[], real: { element: HTMLElement, directives: Type<Directive>[], anyChildrenApplied: boolean }[] } = {
        real: [],
        virtual: []
    };

    private routeRender: RouteRender;

    public directives: Type<Directive | IterationDirective>[] = [];
    private providers: Type<{}>[];

    public get routes() { return Router.routes; }

    constructor(private config: StartConfig) {
    }

    public static config(config: StartConfig) {
        if (!this.instance) {
            this.instance = new NimbleApp(config);
            this.instance.afterInstanciate();
        }
        return this.instance;
    }

    private afterInstanciate() {
        try{
            this.defineRootElement();
            this.registerDirectives();
			this.registerProvidersInContainerInjector();
			
			this._baseHref = document.head.querySelector('base')?.href ?? '/';
			this._baseHref = this._baseHref.replace(location.origin, '');

            // Router
            Router.useHash = this.config.useHash;
            Router.registerRoutes(this.config.routes);

            this.routeRender = this.containerInjector.inject(RouteRender);
        }
        catch(e) {
            console.error(e);
        }
    }

    private defineRootElement() {
        this._rootElement = document.querySelector('nimble-root');
        if (this.rootElement) {
            this.rootElement.innerHTML = '';
            this.rootElement.style.removeProperty('visibility');
        }
        else {
            console.error(`Nimble not work, because the '<nimble-root></nimble-root>' element not found in body.`);
        }
    }

    private registerDirectives() {
        let directives = [...INTERNAL_DIRECTIVES];
        if (this.config.directives && this.config.directives.length > 0)
            directives = directives.concat(this.config.directives);

        directives.forEach((directive) => {
            try {
                directive.prototype.validate(this.directives);
                this.directives.push(directive);
            }
            catch(e) {
                console.error(e);
            }
        });
    }

    private registerProvidersInContainerInjector() {
        let providers = [...INTERNAL_PROVIDERS];
        if (this.config.providers && this.config.providers.length > 0)
            providers = providers.concat(this.config.providers);

        this.providers = providers;

        this.providers.forEach(service => {
            if (service.prototype.single)
                this.containerInjector.addProvider({ provide: service, useSingleton: service });
            else
                this.containerInjector.addProvider({ provide: service, useClass: service });
        });
    }

    public start() {
        if (this.state === NimbleAppState.INITIALIZING) {
            this.registerElements();
            Router.addListener(RouterEvent.STARTED_CHANGE, this.onRouteStartChange.bind(this));
            Router.addListener(RouterEvent.FINISHED_CHANGE, this.onRouteFinishedChange.bind(this));
            Router.addListener(RouterEvent.CHANGE_ERROR, this.onRouteChangeError.bind(this));
            Router.addListener(RouterEvent.STARTED_LOADING, this.onRouteStartedLoading.bind(this));
            Router.addListener(RouterEvent.FINISHED_LOADING, this.onRouteFinishedLoading.bind(this));
            Router.addListener(RouterEvent.ERROR_LOADING, this.onRouteErrorLoading.bind(this));
            Router.addListener(RouterEvent.STARTED_RERENDER, this.onRouteStartRerender.bind(this));
            Router.addListener(RouterEvent.FINISHED_RERENDER, this.onRouteFinishedRerender.bind(this));
            Router.addListener(RouterEvent.RENDERING, this.onRouteRendering.bind(this));
            Router.start();
            this.state = NimbleAppState.INITIALIZED;
        }

        return NimbleApp.instance;
    }

    private registerElements() {
        window.customElements.define('nimble-page', NimblePage);
        window.customElements.define('nimble-router', NimbleRouter);
        window.customElements.define('nimble-dialog', NimbleDialog);
        window.customElements.define('nimble-dialog-area', NimbleDialogArea);
    }

    private onRouteStartChange(route: Route) {
		this.changedRoute = false; 
	}

    private onRouteRendering(route: Route) {
        if (route) {
            // if (Router.rerenderedBeforeFinishedRouteChange) {}
            this.routeRender.prepareRouteToCompileAndRender(route);
            this.routeRender.compileAndRenderRoute(route);
        }
    }

    private onRouteFinishedChange(route: Route) {
        if (route) {
			document.dispatchEvent(new Event('render-event'));

			let { isRendered } = this.routeRender.notifyRoutesAfterRouteChanged(route); 
			
			this.changedRoute = true;
			if (isRendered) {
				this.checkHashLinkAfterRouteChanged();
			}
        }
    }

    private onRouteChangeError(route: Route) {}

    private onRouteStartedLoading(route: Route) {}

    private onRouteFinishedLoading(route: Route) {}

    private onRouteErrorLoading(error, route: Route) {}

    private onRouteStartRerender(route: Route) {
        this.state = NimbleAppState.RERENDERING;
        this.routeRender.rerenderRoute(route);
    }

    private onRouteFinishedRerender(route: Route) {
        document.dispatchEvent(new Event('render-event'));
        this.state = NimbleAppState.INITIALIZED;

		let { isRendered } = this.routeRender.notifyRoutesAfterRerender(route);
		
		if (this.changedRoute && isRendered) {
			this.checkHashLinkAfterRouteChanged();
		}
	}
	
	private checkHashLinkAfterRouteChanged() {
		this.changedRoute = false;
		if (location.hash && !this.config.useHash) {
			setTimeout(() => {
				let currentHash = location.hash;
				location.hash = '';
				location.hash = currentHash;
			}, 250);
		}
		else {
			document.body.style.scrollBehavior = 'initial';
			(document.children.item(0) as HTMLElement).style.scrollBehavior = 'initial';
			setTimeout(() => {
				document.body.scrollTo({top: 0, left: 0});
				document.children.item(0).scrollTo({top: 0, left: 0});
				document.body.style.scrollBehavior = '';
				(document.children.item(0) as HTMLElement).style.scrollBehavior = '';
			});
		}
	}

    public static inject<T>(type: Type<T>, onInstaciate?: (instance: any) => void): T {
        return this.instance.containerInjector.inject<T>(type, onInstaciate);
    }

    public static registerProvider<T>(provider: Provider<T>) {
        this.instance.containerInjector.addProvider(provider);
    }

    public static unregisterProvider<T>(provide: Token<T>) {
        this.instance.containerInjector.removeProvider(provide);
    }

    public static get listener() { return this.instance.containerInjector.inject(Listener); }
}

export enum NimbleAppState {
    INITIALIZING = 'INITIALIZING',
    INITIALIZED = 'INITIALIZED',

    RERENDERING = 'RERENDERING'
}