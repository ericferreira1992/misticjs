import { Directive } from './abstracts/directive';
import { PrepareDirective } from './decorators/prepare-directive.decor';
import { Router } from '../route/router';
import { ListenersCollector } from '../providers/listeners-collector';
import { NimbleApp } from '../app';

@PrepareDirective({
    selector: 'href'
})
export class HrefDirective extends Directive {

	private get baseHref() { return NimbleApp.instance.baseHref; }
	private get hasBaseHref() { return NimbleApp.instance.hasBaseHref; }

    constructor(
        private listenersCollector: ListenersCollector
    ){
        super();
    }

    public onResolve(selector: string, value: any): void {
        selector = this.pureSelector(selector);
        let startsWithHash = value.startsWith('#') || value.startsWith('/#');
        let href = value.replace(/^(#)/g, '');

        if (!value.startsWith('http:') && !value.startsWith('https:')) {
            if (Router.useHash) {
                if (!startsWithHash)
                    href = '#/' + href.replace(/^(\/)/g, '');
                else
                    console.error(`The link "#${href}" with "#" not work in useHash mode setted in NimbleApple.`);
            }
            else if (!Router.useHash) {
                if (startsWithHash) {
                    href = `${location.pathname}#${href}`;
                }
                else if (!href.startsWith('/')) {
					//let prefix = value ? location.pathname : this.baseHref;
					let prefix = this.baseHref;
                    href = `${prefix.replace(/(\/)$/g, '')}/${href}`;
				}

                this.listenersCollector.subscribe(this.element, 'click', (e: MouseEvent) => {
                    let attr = this.element.attributes[selector];
					let href = attr?.value as string;
                    if (!href || href.startsWith(this.baseHref)) {
						// if (this.hasBaseHref && href.startsWith(this.baseHref)) {
						// 	href = href.replace(this.baseHref, '/').replace('//', '/');
						// }
                        setTimeout(() => {
                            Router.redirect(href);
                        });
						e.preventDefault();
                    }
                });
            }
        }

        if (!this.element.hasAttribute(selector))
			this.element.setAttribute(selector, href);
        else
			this.element.attributes[selector].value = href;
    }

    public onDestroy() {
    }

}