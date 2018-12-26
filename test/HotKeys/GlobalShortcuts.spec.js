import React from 'react';
import {mount} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';

import HotKeys from '../../lib/HotKeys';
import KeyCode from '../support/Key';
import FocusableElement from '../support/FocusableElement';
import KeyEventManager from '../../lib/lib/KeyEventManager';

beforeEach(function() {
  KeyEventManager.clear();
});

describe('Global shortcuts:', () => {
  before(function () {
    this.globalKeyMap = {
      'GLOBAL_ACTION': 'a',
      'COMMON_ACTION': 'b',
    };
  });

  context('when global handlers are defined at the top of a React application', () => {
    beforeEach(function () {
      this.globalHandler = sinon.spy();

      this.parentDiv = document.createElement('div');
      this.reactDiv = document.createElement('div');

      document.body.appendChild(this.parentDiv);
      this.parentDiv.appendChild(this.reactDiv);
    });

    afterEach(function() {
      document.body.removeChild(this.parentDiv);
    });

    context('and there is no other HotKeys component', () => {
      beforeEach(function () {
        const handlers = {
          'GLOBAL_ACTION': this.globalHandler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.globalKeyMap} handlers={handlers} global>
            <div className="childElement" />
          </HotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      context('and the React application is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.childElement', { nativeElement: true });
          this.targetElement.focus();
        });

        it('then calls the correct handler when a key is pressed that matches a global handler', function() {
          this.targetElement.keyPress(KeyCode.A);

          expect(this.globalHandler).to.have.been.called;
        });

        it('then does NOT call the handler when a key is pressed that does NOT match a global handler', function() {
          this.targetElement.keyPress(KeyCode.B);

          expect(this.globalHandler).to.not.have.been.called;
        });
      });

      context('and the React application is in NOT focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.childElement', { nativeElement: true });
        });

        it('then calls the correct handler when a key is pressed that matches the keyMap', function() {
          this.targetElement.keyPress(KeyCode.A);

          expect(this.globalHandler).to.have.been.called;
        });

        it('then does NOT call the handler when a key is pressed that does NOT matches the keyMap', function() {
          this.targetElement.keyPress(KeyCode.B);

          expect(this.globalHandler).to.not.have.been.called;
        });
      });
    });

    context('and there is a focus HotKeys inside it', () => {
      beforeEach(function () {
        this.globalCommonActionHandler = sinon.spy();

        const globalHandlers = {
          'GLOBAL_ACTION': this.globalHandler,
          'COMMON_ACTION': this.globalCommonActionHandler
        };

        this.focusKeyMap = {
          'COMMON_ACTION': 'b',
          'FOCUS_ACTION': 'c',
        };

        this.focusActionHandler = sinon.spy();
        this.focusCommonActionHandler = sinon.spy();

        const focusHandlers = {
          'FOCUS_ACTION': this.focusActionHandler,
          'COMMON_ACTION': this.focusCommonActionHandler,
        };

        this.wrapper = mount(
          <HotKeys keyMap={this.globalKeyMap} handlers={globalHandlers} global>
            <HotKeys keyMap={ this.focusKeyMap } handlers={ focusHandlers }>
              <div className="childElement" />
            </HotKeys>
          </HotKeys>,
          { attachTo: this.reactDiv }
        );
      });

      xcontext('and the focus HotKeys is in focus', () => {
        beforeEach(function () {
          this.targetElement = new FocusableElement(this.wrapper, '.childElement', { nativeElement: true });
          this.targetElement.focus();
        });

        it('then calls the global handler when a matching key is pressed', function() {
          this.targetElement.keyPress(KeyCode.A);

          expect(this.globalHandler).to.have.been.called;
        });

        it('then calls the focus handler when a matching key is pressed', function() {
          this.targetElement.keyPress(KeyCode.C);

          expect(this.focusActionHandler).to.have.been.called;
        });

        it('then calls the closest focus handler (over the global handler) when a matching key is pressed', function() {
          this.targetElement.keyPress(KeyCode.B);

          expect(this.focusCommonActionHandler).to.have.been.called;
          expect(this.globalCommonActionHandler).to.not.have.been.called;
        });
      });
    });
  });
});
