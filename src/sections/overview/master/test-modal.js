import React from 'react';

import GroupAggregationModal from './group-aggregation-modal';

// Test per verificare se il componente è importato correttamente
console.log('GroupAggregationModal:', GroupAggregationModal);
console.log('Type of GroupAggregationModal:', typeof GroupAggregationModal);

export default function TestModal() {
  return (
    <div>
      <h1>Test Modal Import</h1>
      <p>Type: {typeof GroupAggregationModal}</p>
      <p>Is function: {typeof GroupAggregationModal === 'function' ? 'Yes' : 'No'}</p>
    </div>
  );
}
