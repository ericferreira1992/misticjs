import { Route } from "../route/route";
import { MetaConfig } from "./decorators/classes/meta-config";
import { IScope } from "./interfaces/scope.interface";

export class Page implements IScope {
    public template: string;
    public title?: string;
    public meta?: MetaConfig;

    public pageParent: any;
    public isInitialized: boolean = false;
    public isDestroyed: boolean = false;

    public onNeedRerender: (page: Page) => Promise<any>;

    /**
     * When element is rendered
     */
    onInit() {
    }

    /**
     * When element is destroyed
     */
    onDestroy() {
    }

    /**
     * When route match with this page and prepares to be rendered
     */
    onEnter() {

    }

    /**
     * When the route changes and the page no longer matches and will be removed
     */
    onExit() {

    }

    /**
     * Method to render and update current template
     */
    public render(action?: () => void): Promise<any> {
        if (action) action();
        if (this.onNeedRerender) {
            return this.onNeedRerender(this);
        }
        return new Promise<any>((resolve) => resolve());
    }

    public eval(expression: string): any {
        return (new Function(`with(this) { return ${expression} }`)).call(this);
        // try {
        // }
        // catch(e) {
        //     console.error(e.message);
        // }
    }
}