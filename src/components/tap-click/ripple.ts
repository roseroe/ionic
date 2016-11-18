import { Activator } from './activator';
import { App } from '../app/app';
import { PointerCoordinates, CSS, hasPointerMoved, pointerCoord, rafFrames } from '../../util/dom';
import { Config } from '../../config/config';


/**
 * @private
 */
export class RippleActivator extends Activator {

  constructor(app: App, config: Config) {
    super(app, config);
  }

  clickAction(ev: UIEvent, activatableEle: HTMLElement, startCoord: PointerCoordinates) {
    this.downAction(ev, activatableEle, startCoord);
    this.upAction(ev, activatableEle, startCoord);
  }

  downAction(ev: UIEvent, activatableEle: HTMLElement, startCoord: PointerCoordinates) {
    if (this.disableActivated(ev) || !activatableEle || !activatableEle.parentNode) {
      return;
    }

    this._active.push(activatableEle);

    var j = activatableEle.childElementCount;
    while (j--) {
      var rippleEle: any = activatableEle.children[j];
      if (rippleEle.classList.contains('button-effect')) {
        // DOM READ
        var clientRect = activatableEle.getBoundingClientRect();
        rippleEle.$top = clientRect.top;
        rippleEle.$left = clientRect.left;
        rippleEle.$width = clientRect.width;
        rippleEle.$height = clientRect.height;
        break;
      }
    }

    // DOM WRITE
    activatableEle.classList.add(this._css);
  }

  upAction(ev: UIEvent, activatableEle: HTMLElement, startCoord: PointerCoordinates) {
    if (!hasPointerMoved(6, startCoord, pointerCoord(ev))) {
      let i = activatableEle.childElementCount;
      while (i--) {
        var rippleEle: any = activatableEle.children[i];
        if (rippleEle.classList.contains('button-effect')) {
          // DOM WRITE
          this.startRippleEffect(rippleEle, activatableEle, startCoord);
          break;
        }
      }
    }

    super.upAction(ev, activatableEle, startCoord);
  }

  startRippleEffect(rippleEle: any, activatableEle: HTMLElement, startCoord: PointerCoordinates) {
    if (!startCoord) {
      return;
    }

    let clientPointerX = (startCoord.x - rippleEle.$left);
    let clientPointerY = (startCoord.y - rippleEle.$top);

    let x = Math.max(Math.abs(rippleEle.$width - clientPointerX), clientPointerX) * 2;
    let y = Math.max(Math.abs(rippleEle.$height - clientPointerY), clientPointerY) * 2;
    let diameter = Math.min(Math.max(Math.hypot(x, y), 64), 240);

    if (activatableEle.hasAttribute('ion-item')) {
      diameter = Math.min(diameter, 140);
    }

    clientPointerX -= diameter / 2;
    clientPointerY -= diameter / 2;

    clientPointerX = Math.round(clientPointerX);
    clientPointerY = Math.round(clientPointerY);
    diameter = Math.round(diameter);

    // Reset ripple
    // DOM WRITE
    rippleEle.style.opacity = '';
    rippleEle.style[CSS.transform] = `translate3d(${clientPointerX}px, ${clientPointerY}px, 0px) scale(0.001)`;
    rippleEle.style[CSS.transition] = '';

    // Start ripple animation
    let radius = Math.sqrt(rippleEle.$width + rippleEle.$height);
    let scaleTransitionDuration = Math.max(1600 * Math.sqrt(radius / TOUCH_DOWN_ACCEL) + 0.5, 260);
    let opacityTransitionDuration = Math.round(scaleTransitionDuration * 0.7);
    let opacityTransitionDelay = Math.round(scaleTransitionDuration - opacityTransitionDuration);
    scaleTransitionDuration = Math.round(scaleTransitionDuration);

    let transform = `translate3d(${clientPointerX}px, ${clientPointerY}px, 0px) scale(1)`;
    let transition = `transform ${scaleTransitionDuration}ms,opacity ${opacityTransitionDuration}ms ${opacityTransitionDelay}ms`;

    rafFrames(2, () => {
      // DOM WRITE
      rippleEle.style.width = rippleEle.style.height = diameter + 'px';
      rippleEle.style.opacity = '0';
      rippleEle.style[CSS.transform] = transform;
      rippleEle.style[CSS.transition] = transition;
    });
  }

  deactivate() {
    rafFrames(2, () => {
      for (var i = 0; i < this._active.length; i++) {
        // DOM WRITE
        this._active[i].classList.remove(this._css);
      }
      this._active.length = 0;
    });
  }

}

const TOUCH_DOWN_ACCEL = 300;

