export function getDatadefFunctions (datadef) {
  const datadefName = datadef.name.toLowerCase().substr(1)
  if (datadef.type === 'union') {
    return [{
      name: `${datadefName}?`,
      description: `Check if the given object is an instance of ${datadef.name}.`,
      params: [{
        name: 'obj',
        type: ':Obj',
        description: 'Object'
      }],
      returns: [{
        type: ':Bool',
        description: `True if the object is an instance of ${datadef.name}, false otherwise`
      }]
    }]
  } else {
    return [{
      name: datadefName,
      description: `Create an instance of ${datadef.name}.`,
      params: datadef.fields,
      returns: [{
        type: datadef.name,
        description: `New ${datadef.name} instance`
      }]
    }, {
      name: `${datadefName}?`,
      description: `Check if the given object is an instance of ${datadef.name}.`,
      params: [{
        name: 'obj',
        type: ':Obj',
        description: 'Object'
      }],
      returns: [{
        type: ':Bool',
        description: `True if the object is an instance of ${datadef.name}, false otherwise`
      }]
    },
    ...datadef.fields.map((field) => ({
        name: `${datadefName}-${field.name}`,
        description: `Get the ${field.name} field of the given ${datadef.name} instance.`,
        params: [{
          name: datadefName,
          type: datadef.name,
          description: `${datadef.name} instance`
        }],
        returns: [{
          type: field.type,
          description: field.description
        }]
      })),
    ...datadef.fields.map((field) => ({
        name: `${datadefName}-${field.name}-set`,
        description: `Set the ${field.name} field of the given ${datadef.name} instance.`,
        params: [{
          name: datadefName,
          type: datadef.name,
          description: `${datadef.name} instance`
        }, {
          name: field.name,
          type: field.type,
          description: field.description
        }],
        returns: [{
          type: datadef.name,
          description: `Updated ${datadef.name} instance`
        }]
      })),
    ...datadef.fields.map((field) => ({
        name: `${datadefName}-${field.name}-do`,
        description: `Update the ${field.name} field of the given ${datadef.name} instance.`,
        params: [{
          name: datadefName,
          type: datadef.name,
          description: `${datadef.name} instance`
        }, {
          name: 'updater',
          type: ':ExeArr',
          description: `Update function that will be called with the current ${field.name} value (${field.type}) and must return a new value`
        }],
        returns: [{
          type: datadef.name,
          description: `Updated ${datadef.name} instance`
        }]
      }))]
  }
}
