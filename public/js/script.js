// Form validation for both .needs-validation and .need-validation
(() => {
    'use strict'
  
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    const forms = document.querySelectorAll('.needs-validation, .need-validation')
  
    // Loop over them and prevent submission
    Array.from(forms).forEach(form => {
      form.addEventListener('submit', event => {
        // Check if this is a review form and validate rating
        const ratingInputs = form.querySelectorAll('input[name="review[rating]"]');
        if (ratingInputs.length > 0) {
          const ratingSelected = Array.from(ratingInputs).some(input => 
            input.checked && input.value !== '' && input.value !== '0' && input.id !== 'no-rate'
          );
          
          if (!ratingSelected) {
            event.preventDefault();
            event.stopPropagation();
            const ratingFieldset = form.querySelector('#rating-fieldset');
            const ratingFeedback = form.querySelector('#rating-feedback');
            if (ratingFieldset) {
              ratingFieldset.style.border = '2px solid #dc3545';
              ratingFieldset.style.borderRadius = '4px';
              ratingFieldset.style.padding = '4px';
            }
            if (ratingFeedback) {
              ratingFeedback.style.display = 'block';
            }
          } else {
            const ratingFieldset = form.querySelector('#rating-fieldset');
            const ratingFeedback = form.querySelector('#rating-feedback');
            if (ratingFieldset) {
              ratingFieldset.style.border = 'none';
            }
            if (ratingFeedback) {
              ratingFeedback.style.display = 'none';
            }
          }
        }
        
        if (!form.checkValidity()) {
          event.preventDefault()
          event.stopPropagation()
        }
  
        form.classList.add('was-validated')
      }, false)
    })
  })()
