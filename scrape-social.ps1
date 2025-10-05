# HamlatAI Social Media Scraper
# Collects PUBLIC data without API keys

# Configuration
$outputDir = "./data"
$searchTerms = @("Iraq election", "Kurdistan vote", "Iraqi candidates 2025", "Kurdish election")
$baseUrls = @{
    Twitter = "https://nitter.net/search?f=tweets&q="
    YouTube = "https://www.youtube.com/results?search_query="
    Facebook = "https://www.facebook.com/public/"
}

# Create data directory if it doesn't exist
if (-not (Test-Path -Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

# Function to clean text
function Clean-Text($text) {
    return $text -replace '[\r\n\t]', ' ' -replace '\s+', ' ' -replace '^\s+|\s+$', ''
}

# Function to get web content
function Get-WebContent($url) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -UserAgent "Mozilla/5.0"
        return $response.Content
    } catch {
        Write-Host "Error accessing $url : $_" -ForegroundColor Red
        return $null
    }
}

# Scrape Nitter (Twitter alternative)
function Get-TwitterData($term) {
    $url = $baseUrls.Twitter + [System.Web.HttpUtility]::UrlEncode($term)
    $content = Get-WebContent -url $url
    
    if ($content) {
        $tweets = [regex]::Matches($content, '(?s)<div class="tweet-content">(.*?)</div>')
        $results = @()
        
        foreach ($tweet in $tweets) {
            $cleanText = Clean-Text $tweet.Groups[1].Value
            if ($cleanText) {
                $results += [PSCustomObject]@{
                    Platform = "Twitter"
                    Content = $cleanText
                    SearchTerm = $term
                    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                }
            }
        }
        
        # Save to CSV
        $results | Export-Csv -Path "$outputDir/twitter_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv" -NoTypeInformation -Append
        return $results.Count
    }
    return 0
}

# Scrape YouTube (public data)
function Get-YouTubeData($term) {
    $url = $baseUrls.YouTube + [System.Web.HttpUtility]::UrlEncode($term)
    $content = Get-WebContent -url $url
    
    if ($content) {
        $videos = [regex]::Matches($content, '(?s)videoId":"(.*?)".*?title":{"runs":\[{"text":"(.*?)"\}')
        $results = @()
        
        foreach ($video in $videos) {
            $videoId = $video.Groups[1].Value
            $title = Clean-Text $video.Groups[2].Value
            
            if ($videoId -and $title) {
                $results += [PSCustomObject]@{
                    Platform = "YouTube"
                    VideoID = $videoId
                    Title = $title
                    SearchTerm = $term
                    Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
                }
            }
        }
        
        # Save to CSV
        $results | Export-Csv -Path "$outputDir/youtube_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv" -NoTypeInformation -Append
        return $results.Count
    }
    return 0
}

# Main execution
Write-Host "🚀 Starting HamlatAI Social Media Scraper" -ForegroundColor Cyan
Write-Host "🔍 Searching for: $($searchTerms -join ', ')"

$totalResults = 0

foreach ($term in $searchTerms) {
    Write-Host "\n🔎 Searching for: $term" -ForegroundColor Yellow
    
    $twitterCount = Get-TwitterData -term $term
    $youtubeCount = Get-YouTubeData -term $term
    
    $totalResults += $twitterCount + $youtubeCount
    
    Write-Host "✅ Found $twitterCount tweets and $youtubeCount videos" -ForegroundColor Green
    
    # Be nice to servers
    Start-Sleep -Seconds 5
}

# Summary
Write-Host "\n🎉 Scraping complete!" -ForegroundColor Green
Write-Host "📊 Total results collected: $totalResults" -ForegroundColor Cyan
Write-Host "💾 Data saved to: $(Resolve-Path $outputDir)" -ForegroundColor Cyan
Write-Host "\n🚀 To analyze the data, run: " -NoNewline
Write-Host "Import-Csv $outputDir/*.csv | Format-Table" -ForegroundColor Yellow
