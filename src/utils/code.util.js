class CodeUtil {

  /**
   * Generate a standardized entity code.
   *
   * Format:
   *   <first 2 characters of EntityType>_<shortened BaseColumn>
   *
   * Example:
   *   generateCode('ROLE', 'Identity Administrator')
   *   => RO_IDENTITYADMIN
   *
   * @param {string} entityType
   * @param {string} baseColumn
   * @returns {string}
   */
  static generateCode(entityType, baseColumn) {

    if (!entityType || typeof entityType !== 'string') {
      throw new Error('EntityType is required');
    }

    if (!baseColumn || typeof baseColumn !== 'string') {
      throw new Error('BaseColumn is required');
    }

    // Entity prefix - minimum 2 characters
    const entityPrefix = entityType
      .trim()
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 2)
      .toUpperCase();

    if (entityPrefix.length < 2) {
      throw new Error(
        'EntityType must contain at least 2 valid characters'
      );
    }

    // Remove special characters and spaces from base value
    const baseName = baseColumn
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '');

    if (!baseName) {
      throw new Error('BaseColumn must contain valid characters');
    }

    // Convert to uppercase
    const shortBaseName = baseName.toUpperCase();

    return `${entityPrefix}_${shortBaseName}`;
  }
}

module.exports = CodeUtil;