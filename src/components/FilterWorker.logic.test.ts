import { filterAndComputeOptions } from './FilterWorker';

describe('filterAndComputeOptions', () => {
    it('returns all data and options when no filters are applied', () => {
        const rawData = [
            { a: 'x', b: '1' },
            { a: 'y', b: '2' }
        ];
        const filters = {};
        const selectedColumns: string[] = [];
        const { filteredData, availableFilterOptions } = filterAndComputeOptions(rawData, filters, selectedColumns);
        expect(filteredData).toEqual(rawData);
        expect(availableFilterOptions.a).toEqual([
            { value: 'x', count: 1 },
            { value: 'y', count: 1 }
        ]);
        expect(availableFilterOptions.b).toEqual([
            { value: '1', count: 1 },
            { value: '2', count: 1 }
        ]);
    });

    it('filters data and computes options correctly', () => {
        const rawData = [
            { a: 'x', b: '1' },
            { a: 'y', b: '2' },
            { a: 'x', b: '2' }
        ];
        const filters = { a: ['x'] };
        const selectedColumns: string[] = [];
        const { filteredData, availableFilterOptions } = filterAndComputeOptions(rawData, filters, selectedColumns);
        expect(filteredData).toEqual([
            { a: 'x', b: '1' },
            { a: 'x', b: '2' }
        ]);
        // For column 'a', both 'x' and 'y' should be shown, but 'x' is selected and first
        expect(availableFilterOptions.a[0].value).toBe('x');
        expect(availableFilterOptions.a.map(o => o.value)).toContain('y');
        // For column 'b', both '1' and '2' should be shown
        expect(availableFilterOptions.b.map(o => o.value)).toEqual(['1', '2']);
    });

    it('returns only selected columns if specified', () => {
        const rawData = [
            { a: 'x', b: '1', c: 'foo' },
            { a: 'y', b: '2', c: 'bar' }
        ];
        const filters = {};
        const selectedColumns = ['a', 'c'];
        const { filteredData } = filterAndComputeOptions(rawData, filters, selectedColumns);
        expect(filteredData).toEqual([
            { a: 'x', c: 'foo' },
            { a: 'y', c: 'bar' }
        ]);
    });
});
