document.addEventListener('DOMContentLoaded', () => {
    const kanbanColumns = document.querySelectorAll('.kanban-column');

    kanbanColumns.forEach(column => {
        new Sortable(column, {
            group: 'deliveries', // set all columns to same group
            animation: 150,
            onEnd: function (evt) {
                const itemId = evt.item.dataset.id;
                const newStatus = evt.to.dataset.status;
                const oldStatus = evt.from.dataset.status;

                if (newStatus !== oldStatus) {
                    fetch(`/deliveries/${itemId}/status`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: newStatus })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            console.log(`Delivery ${itemId} status updated to ${newStatus}`);
                            // Optionally, update UI or show a success message
                        } else {
                            console.error('Failed to update delivery status:', data.message);
                            // Revert UI on error
                            evt.from.appendChild(evt.item); 
                            alert('Failed to update delivery status: ' + data.message);
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        // Revert UI on error
                        evt.from.appendChild(evt.item);
                        alert('An error occurred while updating delivery status.');
                    });
                }
            },
        });
    });
});