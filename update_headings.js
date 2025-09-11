const fs = require('fs');
const path = require('path');

// Mapping of page titles to their respective taglines
const pageData = {
    'bags.html': {
        title: 'Fashion Hood',
        tagline: 'Carry Elegance Wherever You Go'
    },
    'mens-glasses.html': {
        title: "Men's Glasses",
        tagline: 'Frame Your Vision in Style'
    },
    'mens-perfumes.html': {
        title: "Men's Perfumes",
        tagline: 'A Scent That Speaks Volumes'
    },
    'mens-watches.html': {
        title: "Men's Watches",
        tagline: 'Timeless Elegance on Your Wrist'
    },
    'mens_shoes.html': {
        title: "Men's Shoes",
        tagline: 'Step with Confidence & Style'
    },
    'womens-glasses.html': {
        title: "Women's Glasses",
        tagline: 'See the World in Style'
    },
    'womens-perfumes.html': {
        title: "Women's Perfumes",
        tagline: 'Bottled Elegance for Every Occasion'
    },
    'womens-watches.html': {
        title: "Women's Watches",
        tagline: 'Timeless Beauty for Your Wrist'
    },
    'womens_sandals.html': {
        title: "Women's Sandals",
        tagline: 'Step Out in Comfort & Style'
    },
    'womens_shoes.html': {
        title: "Women's Shoes",
        tagline: 'Step into Elegance & Sophistication'
    }
};

// Function to update the HTML file
function updateFile(filePath) {
    const fileName = path.basename(filePath);
    
    if (!pageData[fileName]) {
        console.log(`No data found for ${fileName}, skipping...`);
        return;
    }

    const { title, tagline } = pageData[fileName];
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading file ${filePath}:`, err);
            return;
        }

        // Update the title tag
        let updatedContent = data.replace(
            /<title>.*<\/title>/i,
            `<title>${title} | Luxury Store<\/title>`
        );

        // Update the heading section
        updatedContent = updatedContent.replace(
            /<h2[^>]*>.*<\/h2>\s*<div id="products"/s,
            `<div class="section-header text-center mb-5">
                <h2 class="display-5 fw-bold text-uppercase position-relative d-inline-block mb-4">
                    <span class="position-relative z-2">${title}</span>
                    <span class="position-absolute bottom-0 start-50 translate-middle-x bg-primary" style="height: 4px; width: 80px;"></span>
                </h2>
                <p class="text-muted lead mb-0">${tagline}</p>
            </div>
            <div id="products"`
        );

        // Write the updated content back to the file
        fs.writeFile(filePath, updatedContent, 'utf8', (err) => {
            if (err) {
                console.error(`Error writing to file ${filePath}:`, err);
                return;
            }
            console.log(`Successfully updated ${filePath}`);
        });
    });
}

// Process all HTML files in the directory
const directoryPath = __dirname;

fs.readdir(directoryPath, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    files.forEach(file => {
        if (file.endsWith('.html') && file !== 'index.html' && file !== 'about.html' && file !== 'contact.html') {
            updateFile(path.join(directoryPath, file));
        }
    });
});
