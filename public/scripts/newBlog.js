CKEDITOR.stylesSet.add( 'jimmys_styles',
[
    { name: 'Bordered Image', element: 'img', attributes: { 'class': 'ui bordered image' } },
    { name: 'Rounded Image', element: 'img', attributes: { 'class': 'ui rounded image' } },
    { name: 'Fluid Image', element: 'img', attributes: { 'class': 'ui fluid image' } },
    { name: 'Centered Image', element: 'img', attributes: { 'class': 'ui centered image' } }
]);

$("#newBlogContent").ckeditor(function() {}, {stylesSet: 'jimmys_styles' });

function openImageWindow()
{
  window.open("/images", "_blank", "toolbar=yes,scrollbars=yes,resizable=yes,top=150,left=350,width=600,height=600");
}