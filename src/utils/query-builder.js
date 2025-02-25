export const buildSearchQueries = (fullName, nameParts, firstName, secondName, thirdName) => {
    // Create regex for each name part
    const firstNameRegex = new RegExp(firstName, 'i');
    const secondNameRegex = new RegExp(secondName, 'i');
    const thirdNameRegex = new RegExp(thirdName, 'i');
    
    // Create regex for full name to search in aliasNames
    const fullNameRegex = new RegExp(fullName, 'i');
    
    // Create regex for each individual name part to match against aliasNames
    const namePartsRegexes = nameParts.map(part => new RegExp(part, 'i'));
    
    // Build the query for individuals
    const individualQuery = {
      $or: [
        // Match by exact name parts
        { firstName: firstNameRegex },
        { secondName: secondNameRegex },
        { thirdName: thirdNameRegex },
        // Match full name against aliasNames
        { aliasNames: fullNameRegex },
        // Match individual name parts against aliasNames
        ...namePartsRegexes.map(regex => ({ aliasNames: regex }))
      ]
    };
    
    // Build the query for entities
    const entityQuery = {
      $or: [
        // Match against entity name
        { entityName: fullNameRegex },
        // Match individual parts against entity name
        ...namePartsRegexes.map(regex => ({ entityName: regex })),
        // Match full name against aliasNames
        { aliasNames: fullNameRegex },
        // Match individual name parts against aliasNames
        ...namePartsRegexes.map(regex => ({ aliasNames: regex }))
      ]
    };
    
    return { individualQuery, entityQuery };
  };