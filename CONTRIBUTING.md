# Contributing to GeoPathFinder

First off, thank you for considering contributing to GeoPathFinder! It's people like you that make open source such a great community.

## Where do I go from here?

If you've noticed a bug or have a feature request, [make one](https://github.com/Razielwar/geopathfinder/issues/new)! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

### Fork & create a branch

If this is something you think you can fix, then [fork GeoPathFinder](https://github.com/Razielwar/geopathfinder/fork) and create a branch with a descriptive name.

A good branch name would be (where issue #123 is the ticket you're working on):

```bash
git checkout -b 123-add-le-s-algorithm
```

### Get the code

```bash
git clone https://github.com/your-username/geopathfinder.git
cd geopathfinder
yarn install
```

### Run the tests

```bash
yarn test
```

### Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first :smile_cat:

### Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with GeoPathFinder's master branch:

```bash
git remote add upstream git@github.com:Razielwar/geopathfinder.git
git checkout main
git pull upstream main
```

Then update your feature branch from your local copy of master, and push it!

```bash
git checkout 123-add-le-s-algorithm
git rebase main
git push --set-upstream origin 123-add-le-s-algorithm
```

Finally, go to GitHub and [make a Pull Request](https://github.com/Razielwar/geopathfinder/compare)

### Keeping your Pull Request updated

If a maintainer asks you to "rebase" your PR, they're saying that a lot of code has changed, and that you need to update your branch so it's easier to merge.

To learn more about rebasing and merging, check out this guide on [merging vs. rebasing](https://www.atlassian.com/git/tutorials/merging-vs-rebasing).

## Quality and Acceptance Criteria

To maintain the quality of the project, we have a set of acceptance criteria for all contributions.

*   **100% Code Coverage:** All new code should be fully tested to ensure we maintain 100% code coverage.
*   **Regression Tests:** When fixing a bug, a corresponding test case must be added to prevent regressions.
*   **Coding Style:** Code must adhere to the project's coding style, enforced by Prettier and ESLint. You can run `yarn format` and `yarn lint` to check your code.
*   **Clear Documentation:** New features should be clearly documented. Code comments should be used where necessary to explain complex logic.
*   **Conventional Commit Messages:** Commit messages should follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. This helps in generating automated changelogs and understanding the history of the project.
*   **Passing Tests:** All existing tests must pass.
*   **No Performance Degradation:** Changes should not negatively impact the performance of the library. If possible, include benchmarks for performance-sensitive changes.
## Coding Style

Please follow the coding style of the project. We use [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) to enforce a consistent style. You can run the following commands to format and lint your code:

```bash
yarn format
yarn lint