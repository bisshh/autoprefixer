let Prefixer = require('./prefixer')
let utils = require('./utils')

let n2f = require('num2fraction')

const REGEXP = /(min|max)-resolution\s*:\s*\d*\.?\d+(dppx|dpi)/gi
const SPLIT = /(min|max)-resolution(\s*:\s*)(\d*\.?\d+)(dppx|dpi)/i

class Resolution extends Prefixer {
  /**
     * Return prefixed query name
     */
  prefixName (prefix, name) {
    if (prefix === '-moz-') {
      return name + '--moz-device-pixel-ratio'
    } else {
      return prefix + name + '-device-pixel-ratio'
    }
  }

  /**
     * Return prefixed query
     */
  prefixQuery (prefix, name, colon, value, units) {
    if (units === 'dpi') {
      value = Number(value / 96)
    }
    if (prefix === '-o-') {
      value = n2f(value)
    }
    return this.prefixName(prefix, name) + colon + value
  }

  /**
     * Remove prefixed queries
     */
  clean (rule) {
    if (!this.bad) {
      this.bad = []
      for (let prefix of this.prefixes) {
        this.bad.push(this.prefixName(prefix, 'min'))
        this.bad.push(this.prefixName(prefix, 'max'))
      }
    }

    rule.params = utils.editList(rule.params, queries => {
      return queries.filter(
        query => this.bad.every(i => query.indexOf(i) === -1)
      )
    })
  }

  /**
     * Add prefixed queries
     */
  process (rule) {
    let parent = this.parentPrefix(rule)
    let prefixes = parent ? [parent] : this.prefixes

    rule.params = utils.editList(rule.params, (origin, prefixed) => {
      for (let query of origin) {
        if (query.indexOf('min-resolution') === -1 &&
                    query.indexOf('max-resolution') === -1) {
          prefixed.push(query)
          continue
        }

        for (let prefix of prefixes) {
          let processed = query.replace(REGEXP, str => {
            let parts = str.match(SPLIT)
            return this.prefixQuery(
              prefix,
              parts[1],
              parts[2],
              parts[3],
              parts[4]
            )
          })
          prefixed.push(processed)
        }
        prefixed.push(query)
      }

      return utils.uniq(prefixed)
    })
  }
}

module.exports = Resolution
