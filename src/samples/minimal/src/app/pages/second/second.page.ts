import { Page, PreparePage, Listener } from '@nimble-ts/core';

@PreparePage({
    template: require('./second.page.html'),
    style: require('./second.page.scss'),
    title: 'Nimble - First Page'
})
export class SecondPage extends Page {

	public mouseDown = false;
	public mousePrevPosition = { X: 0, Y: 0 };
	public boxPositioned = { X: 0, Y: 0 };

    constructor(
		private listener: Listener
	) {
		super();
		this.mousePrevPosition.X = window.innerWidth / 2;
		this.boxPositioned.X = window.innerWidth / 2;
	}

	onInit() {
		this.listener.listen(window, 'mousemove', this.onMouseMove.bind(this))
	}

	public onMouseDownChange(event: MouseEvent, down: boolean) {
		this.render(() => {
			this.mousePrevPosition.X = event.clientX;
			this.mousePrevPosition.Y = event.clientY;
			this.mouseDown = down;
		});
	}

	public onMouseMove(event: MouseEvent) {
		event.preventDefault();
		if (this.mouseDown) {
			this.render(() => {
				this.boxPositioned.X += event.clientX - this.mousePrevPosition.X;
				this.boxPositioned.Y += event.clientY - this.mousePrevPosition.Y;
				this.mousePrevPosition.X = event.clientX;
				this.mousePrevPosition.Y = event.clientY;
			});
		}
	}
}