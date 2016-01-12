import { Injector } from '../src';

describe('Injector', () => {
    let injector;
    beforeEach(() => (injector = new Injector()));

    it('Has a defined injector', () => expect(injector).not.toBeNull());

    it('Injects a basic type by variable name', () => {
        const someValue = 'Hello World';
        injector.map('someValue').toValue(someValue);

        const someObject = {
            someValue: 'inject'
        };
        injector.injectInto(someObject);

        expect(someObject.someValue).toBe(someValue);
    });

    it('Injects a newly created type by variable name', () => {
        function SomeClass() {
            this.hello = 'Hello World';
        }

        injector.map('someValue').toType(SomeClass);

        const someObject = {
            someValue: 'inject'
        };
        injector.injectInto(someObject);

        expect(someObject.someValue.hello).toBe('Hello World');
    });

    it('Injects a specific type that doesn\'t have anything to do with the variable name', () => {
        const someValue = 'Hello World';
        injector.map('someValue').toValue(someValue);

        const someObject = {
            otherValue: 'inject:someValue'
        };
        injector.injectInto(someObject);

        expect(someObject.otherValue).toBe(someValue);
    });

    it('injects an object by name', () => {
        const someValue1 = 'Hello World 1';
        const someValue2 = 'Hello World 2';

        injector.map('someValue', 'one').toValue(someValue1);
        injector.map('someValue', 'two').toValue(someValue2);

        const someObject1 = {
            someValue: 'inject(name="one")'
        };
        injector.injectInto(someObject1);

        const someObject2 = {
            someValue: 'inject(name="two")'
        };
        injector.injectInto(someObject2);

        expect(someObject1.someValue).toBe(someValue1);
        expect(someObject2.someValue).toBe(someValue2);
    });

    it(`Injects a named specific type that doesn't have anything to do with the variable name`, () => {
        var someValue1 = 'Hello World 1';
        var someValue2 = 'Hello World 2';

        injector.map('someValue', 'one').toValue(someValue1);
        injector.map('someValue', 'two').toValue(someValue2);

        var someObject = {
            otherValue1: 'inject(name="one"):someValue',
            otherValue2: 'inject(name="two"):someValue'
        };
        injector.injectInto(someObject);

        expect(someObject.otherValue1).toBe(someValue1);
        expect(someObject.otherValue2).toBe(someValue2);
    });

    it('Calls post constructs', () => {
        const someValue = 'Hello World';
        injector.map('someValue').toValue(someValue);

        const someObject = {
            postConstructs: ['onPostConstruct'],
            counter: 0,
            someValue: 'inject',

            onPostConstruct() {
                this.counter++;
            }
        };
        injector.injectInto(someObject);

        expect(someObject.counter).toBe(1);
    });

    it('Calls post constructs and injects on a newly created instance', () => {
        const someValue = 'Hello World';
        injector.map('someValue').toValue(someValue);

        class MyClass {
            someValue = 'inject';
            postConstructs = ['onPostConstruct'];
            constructor() {
                this.counter = 0;
            }

            onPostConstruct() {
                this.counter++;
            }
        }

        const someObject = new MyClass();
        injector.injectInto(someObject);
        expect(someObject.counter).toBe(1);
        expect(someObject.someValue).toBe(someValue);
    });

    it('returns an instance', () => {
        var someObject = () => {};

        someObject.prototype = { testVar: 'test' };

        injector.map('someObject').toType(someObject);

        var someCreatedObject1 = injector.getInstance('someObject');

        expect(someCreatedObject1.testVar).toEqual('test');
    });

    it('returns two unique instances', () => {
        var someObject = () => {};

        someObject.prototype = { testVar: 'test' };

        injector.map('someObject').toType(someObject);

        var someCreatedObject1 = injector.getInstance('someObject');
        var someCreatedObject2 = injector.getInstance('someObject');
        someCreatedObject2.testVar = 'hello world';

        expect(someCreatedObject1.testVar).not.toEqual(someCreatedObject2.testVar);
    });

    it('returns the same singleton instance', () => {
        var someObject = () => {};

        someObject.prototype = { testVar: 'test' };

        injector.map('someObject').toSingleton(someObject);

        var someCreatedObject1 = injector.getInstance('someObject');
        var someCreatedObject2 = injector.getInstance('someObject');
        someCreatedObject2.testVar = 'hello world';

        expect(someCreatedObject1.testVar).toEqual(someCreatedObject2.testVar);
    });

    it('returns a specific error when there is no mapping', () => {
        expect(() => {injector.getInstance('someObject');}).toThrow(new Error('Cannot return instance "someObject" because no mapping has been found'));
        expect(() => {injector.getInstance('someObject', 'someName');}).toThrow(new Error('Cannot return instance "someObject by name someName" because no mapping has been found'));
    });

    it('can unmap mappings by type', () => {
        var someValue = 'Hello World';
        injector.map('someValue').toValue(someValue);
        expect(injector.getInstance('someValue')).toBe(someValue);

        injector.unmap('someValue');

        expect(() => {injector.getInstance('someValue');}).toThrow(new Error('Cannot return instance "someValue" because no mapping has been found'));
    });

    it('can unmap mappings by type and name', () => {
        var someValue = 'Hello World';
        injector.map('someValue', 'myName').toValue(someValue);
        expect(injector.getInstance('someValue', 'myName')).toBe(someValue);

        injector.unmap('someValue', 'myName');

        expect(() => {injector.getInstance('someValue', 'myName');}).toThrow(new Error('Cannot return instance "someValue by name myName" because no mapping has been found'));
    });

    it('registers itself by the injector', () => {
        expect(injector.getInstance('injector')).toBe(injector);
    });

    it('can teardown itself (aka. unmapAll)', () => {
        var someValue = 'Hello World';
        injector.map('someValue').toValue(someValue);
        expect(injector.getInstance('someValue')).toBe(someValue);
        injector.map('someValue2').toValue(someValue);
        expect(injector.getInstance('someValue2')).toBe(someValue);

        injector.teardown();

        expect(() => {injector.getInstance('someValue');}).toThrow(new Error('Cannot return instance "someValue" because no mapping has been found'));
        expect(() => {injector.getInstance('someValue2');}).toThrow(new Error('Cannot return instance "someValue2" because no mapping has been found'));
    });

    describe('childInjector', () => {

        it('defaults to null when it was not instantiated by a parent', () => {
            expect(injector.getParentInjector()).toBeNull();
        });

        it('can create a childInjector which references to its parent', () => {
            var childInjector = injector.createChildInjector();

            expect(childInjector).not.toBeNull();
            expect(childInjector.getParentInjector()).toBe(injector);
            expect(childInjector).not.toBe(injector);
        });

        it('has no parentInjector when it is the top parent', () => {
            expect(injector.getParentInjector()).toBeNull();

            var childInjector = injector.createChildInjector();
            expect(injector.getParentInjector()).toBeNull();
        });

        it('can set the parentInjector', () => {
            var parentInjector = new Injector();
            injector.setParentInjector(parentInjector);

            expect(injector.getParentInjector()).toBe(parentInjector);
        });

        it('throws an error when trying to set a parentInjector which is not an injector (or null)', () => {
            var parentInjector = {};

            expect(() => {injector.setParentInjector(parentInjector);}).toThrow(new Error('Cannot set the parentInjector because it is not an injector'));
            expect(injector.getParentInjector()).toBeNull();
        });

        it('can nullify the parentInjector', () => {
            var parentInjector = new Injector();
            injector.setParentInjector(parentInjector);

            expect(() => {injector.setParentInjector(null);}).not.toThrow();
            expect(injector.getParentInjector()).toBeNull();
        });

        it('validates mappings on a child that stem from its parent as if it were its own mappings', () => {
            const childInjector = injector.createChildInjector();

            expect(injector.hasMapping('someValue')).toBe(false);
            expect(childInjector.hasMapping('someValue')).toBe(false);

            const someValue = 'Hello World';
            injector.map('someValue').toValue(someValue);

            expect(injector.hasMapping('someValue')).toBe(true);
            expect(childInjector.hasMapping('someValue')).toBe(true);
        });

        it('hides mappings from its parent', () => {
            const childInjector = injector.createChildInjector();
            const someValue = 'Hello World';
            childInjector.map('someValue').toValue(someValue);

            expect(childInjector.hasMapping('someValue')).toBe(true);
            expect(injector.hasMapping('someValue')).toBe(false);
        });

        it('returns the instance that was mapped on the parent', () => {
            const childInjector = injector.createChildInjector();

            const someValue = 'Hello World';
            injector.map('someValue').toValue(someValue);

            expect(injector.getInstance('someValue')).toBe(someValue);
            expect(childInjector.getInstance('someValue')).toBe(someValue);
        });

        it('throws an error when the parent tries to get access to a mapping that was only mapped on the childInjector', () => {
            const childInjector = injector.createChildInjector();
            const someValue = 'Hello World';
            childInjector.map('someValue').toValue(someValue);

            expect(childInjector.getInstance('someValue')).toBe(someValue);
            expect(() => {injector.getInstance('someValue');})
                .toThrow(new Error('Cannot return instance "someValue" because no mapping has been found'));
        });

        it('can create multiple child injectors', () => {
            const injectorChild1 = injector.createChildInjector();
            const injectorChild2 = injector.createChildInjector();
            const injector1Child = injectorChild1.createChildInjector();

            expect(injector.getParentInjector()).toBeNull();
            expect(injectorChild1.getParentInjector()).toBe(injector);
            expect(injectorChild2.getParentInjector()).toBe(injector);
            expect(injector1Child.getParentInjector()).toBe(injectorChild1);
        });

        it('can access mappings from a parent multiple levels up', () => {
            const injectorChild1 = injector.createChildInjector();
            const injector1Child = injectorChild1.createChildInjector();

            const someValue = 'Hello World';
            injector.map('someValue').toValue(someValue);
            const otherValue = 'Hello child!';
            injectorChild1.map('otherValue').toValue(otherValue);

            expect(injector.getInstance('someValue')).toBe(someValue);
            expect(injectorChild1.getInstance('someValue')).toBe(someValue);
            expect(injector1Child.getInstance('someValue')).toBe(someValue);

            expect(injectorChild1.getInstance('otherValue')).toBe(otherValue);
            expect(injector1Child.getInstance('otherValue')).toBe(otherValue);
        });

        it('can create mappings for keys that already exist on the parent', () => {
            var injectorChild = injector.createChildInjector();

            var someValue = 'Hello World';
            injector.map('someValue').toValue(someValue);
            var otherValue = 'Hello child!';

            expect(() => {
                injectorChild.map('someValue').toValue(otherValue);
            }).not.toThrow(new Error('Already has mapping for someValue'));
        });

        it('force maps itself as the injector', () => {
            var injectorChild = injector.createChildInjector();

            expect(injector).not.toBe(injectorChild);
            expect(injector.getInstance('injector')).toBe(injector);
            expect(injectorChild.getInstance('injector')).toBe(injectorChild);
        });

        it('can verify if the injector has a mapping', () => {
            var someValue = 'Hello World';
            injector.map('someValue').toValue(someValue);

            expect(injector.hasMapping('someValue')).toBeTruthy();
        });

        it('can verify if the injector has a mapping on the parent injector', () => {
            var injectorChild = injector.createChildInjector();
            var someValue = 'Hello World';
            injector.map('someValue').toValue(someValue);

            expect(injectorChild.hasMapping('someValue')).toBeTruthy();
        });

        it('can verify if the injector has a direct mapping', () => {
            var injectorChild = injector.createChildInjector();
            var someValue = 'Hello World';
            injector.map('someValue').toValue(someValue);

            expect(injector.hasDirectMapping('someValue')).toBeTruthy();
            expect(injectorChild.hasDirectMapping('someValue')).toBeFalsy();
        });
    });
});
