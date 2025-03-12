export const extractValues = (field) => {
    if (!field) return ['N/A'];
    
    if (field.VALUE && Array.isArray(field.VALUE)) {
        return field.VALUE;
    }
    
    if (field.VALUE) {
        return [field.VALUE];
    }
    
    return ['N/A'];
};

export const extractArrayField = (field, key) => {
    if (!field) return ['N/A'];
    
    if (Array.isArray(field)) {
        const values = field.map(item => item[key] || 'N/A').filter(val => val !== '');
        return values.length > 0 ? values : ['N/A'];
    }
    
    if (field[key]) {
        return [field[key]];
    }
    
    return ['N/A'];
};