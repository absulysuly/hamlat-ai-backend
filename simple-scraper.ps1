# Simple Social Media Scraper
$outputDir = "./scraped_data"
$searchTerms = @("Iraq election", "Kurdistan vote", "Iraqi candidates 2025")

# Create output directory
if (-not (Test-Path -Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Simple web request function
function Get-WebData($url) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -UserAgent "Mozilla/5.0"
        return $response.Content
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        return $null
    }
}

# Main scraping function
function Start-Scraping {
    $allResults = @()
    
    foreach ($term in $searchTerms) {
        Write-Host "Searching for: $term" -ForegroundColor Yellow
        
        # Example: Search Twitter via Nitter
        $url = "https://nitter.net/search?f=tweets&q=" + [System.Web.HttpUtility]::UrlEncode($term)
        $content = Get-WebData -url $url
        
        if ($content) {
            $tweets = [regex]::Matches($content, '(?s)<div class="tweet-content">(.*?)</div>')
            
            foreach ($tweet in $tweets) {
                $cleanText = $tweet.Groups[1].Value -replace '[\r\n\t]', ' ' -replace '\s+', ' ' -replace '^\s+|\s+$', ''
                
                if ($cleanText) {
                    $result = [PSCustomObject]@{
                        Platform = "Twitter"
                        Content = $cleanText
                        SearchTerm = $term
                        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                    }
                    $allResults += $result
                    Write-Host "Found: $($cleanText.Substring(0, [Math]::Min(50, $cleanText.Length)))..."
                }
            }
        }
        
        # Be nice to servers
        Start-Sleep -Seconds 2
    }
    
    # Save results
    if ($allResults.Count -gt 0) {
        $csvPath = "$outputDir/results_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
        $allResults | Export-Csv -Path $csvPath -NoTypeInformation
        Write-Host "\n✅ Saved $($allResults.Count) results to $csvPath" -ForegroundColor Green
    } else {
        Write-Host "\n❌ No results found. Try different search terms." -ForegroundColor Red
    }
}

# Start scraping
Write-Host "🚀 Starting HamlatAI Social Media Scraper" -ForegroundColor Cyan
Start-Scraping
